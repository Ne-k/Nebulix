import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import multer from 'multer';
import { RecaptchaEnterpriseServiceClient, protos } from '@google-cloud/recaptcha-enterprise';
import { config } from 'dotenv';
config();


const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const encodeBase64 = (str: string) => {
    return Buffer.from(str).toString('base64');
};

const upload = multer();

const validateRecaptchaToken = async (token: string) => {
    const projectID = String(process.env.GOOGLE_PROJECT_ID);
    const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;
    const recaptchaAction = "submit";

    console.log(recaptchaKey);

    const client = new RecaptchaEnterpriseServiceClient({
        credentials: {
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL
        },
        projectId: projectID
    });

    const projectPath = client.projectPath(projectID);

    const request: protos.google.cloud.recaptchaenterprise.v1.ICreateAssessmentRequest = {
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
        response.riskAnalysis?.reasons?.forEach((reason: protos.google.cloud.recaptchaenterprise.v1.RiskAnalysis.ClassificationReason) => {
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

    try {
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

export default handler;
