import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { config } from 'dotenv';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

config();

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const encodeBase64 = (str: string) => {
    return Buffer.from(str).toString('base64');
};

const getClientId = (req: VercelRequest): string | null => {
    const clientId = req.headers['x-client-id'];
    return typeof clientId === 'string' ? clientId : null;
};

const clientRateLimiters = new Map<string, ReturnType<typeof rateLimit>>();
const ipRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 3,
    handler: (_req, res) => {
        res.status(429).send('Too many requests from this IP, please try again later. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
    }
});

const createRateLimiter = () => rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 3,
    handler: (_req, res) => {
        res.status(429).send('Too many requests from this client, please try again later. If you continue to have issues, please feel free to talk to a team member and we can help you out.');
    }
});

const upload = multer();

const validateRecaptchaToken = async (token: string) => {
    const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID || "default-project-id";
    const recaptchaKey = process.env.RECAPTCHA_SITE_KEY || "default-site-key";
    const recaptchaAction = "submit";

    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    const request = {
        assessment: {
            event: {
                token: token,
                siteKey: recaptchaKey,
            },
        },
        parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    if (!response.tokenProperties?.valid) {
        console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties?.invalidReason ?? 'Unknown reason'}`);
        return false;
    }

    if (response.tokenProperties?.action === recaptchaAction) {
        console.log(`The reCAPTCHA score is: ${response.riskAnalysis?.score ?? 'Unknown'}`);
        response.riskAnalysis?.reasons?.forEach((reason) => {
            console.log(reason);
        });

        return true;
    } else {
        console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
        return false;
    }
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    const clientId = getClientId(req);

    const applyRateLimiter = (limiter: ReturnType<typeof rateLimit>) => {
        return new Promise<void>((resolve, reject) => {
            limiter(req as any, res as any, (err: unknown) => {
                if (err) return reject(err);
                resolve();
            });
        });
    };

    try {
        if (clientId) {
            if (!clientRateLimiters.has(clientId)) {
                clientRateLimiters.set(clientId, createRateLimiter());
            }

            const limiter = clientRateLimiters.get(clientId);
            if (!limiter) {
                return res.status(500).send('Rate limiter initialization error');
            }

            await applyRateLimiter(limiter);
        } else {
            await applyRateLimiter(ipRateLimiter);
        }

        // Parse the form data
        upload.none()(req as any, res as any, async (err: any) => {
            if (err) {
                return res.status(500).send('Error parsing form data');
            }

            const { name, team, contact, offer, tradeFor, recaptchaToken } = req.body;
            console.log('Parsed Form Data:', { name, team, contact, offer, tradeFor });

            const isValidRecaptcha = await validateRecaptchaToken(recaptchaToken);
            if (!isValidRecaptcha) {
                return res.status(400).send('Invalid reCAPTCHA token');
            }

            const nameCapitalized = capitalizeWords(name);
            const sanitizedContact = contact.replace(/[\s-]/g, '_');
            const encodedContact = encodeBase64(sanitizedContact);

            const threadResponse = await axios.post(
                `https://discord.com/api/v9/channels/${channelId}/threads`,
                {
                    name: `New Trade Request: ${nameCapitalized} From ${team}`,
                    auto_archive_duration: 10080,
                    type: 11,
                },
                {
                    headers: {
                        'Authorization': `Bot ${discordBotToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Thread response:', threadResponse.data);

            const threadId = threadResponse.data.id;

            const embed = {
                title: "New Trade Request",
                description: `
                    \`${nameCapitalized}\` from \`${team}\` would like to trade \`${offer}\` for \`${tradeFor}\`.
                    **Contact Information:** [Revealed when you claim the trade]
                `,
                color: 3447003,
                footer: {
                    text: `${encodedContact}`
                }
            };

            const components = [
                {
                    type: 1, // Action row
                    components: [
                        {
                            type: 2, // Button
                            style: 1, // Primary style
                            label: "Claim",
                            custom_id: `Trading_${encodedContact}`
                        },
                        {
                            type: 2, // Button
                            style: 2,
                            label: "Delete Request",
                            custom_id: `Delete_${threadId}`
                        }
                    ]
                }
            ];

            const messageResponse = await axios.post(
                `https://discord.com/api/v9/channels/${threadId}/messages`,
                {
                    embeds: [embed],
                    components: components
                },
                {
                    headers: {
                        'Authorization': `Bot ${discordBotToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Message response:', messageResponse.data);

            res.status(200).send('Message sent');
        });
    } catch (error: unknown) {
        const typedError = error as any;
        console.error('Error:', typedError.message, typedError.response?.data);
        res.status(500).send({ error: 'Server Error', details: typedError.message });
    }
};

module.exports = handler;
