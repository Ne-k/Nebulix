import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { config } from 'dotenv';
import multer from 'multer';

config();

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const encodeBase64 = (str: string) => {
    return Buffer.from(str).toString('base64');
};

const upload = multer();

const validateRecaptchaToken = async (token: string) => {
    const apiKey = process.env.RECAPTCHA_SECRET_KEY;
    const requestBody = {
        event: {
            token: token,
            expectedAction: "submit",
            siteKey: process.env.RECAPTCHA_SITE_KEY
        }
    };

    try {
        const response = await axios.post(
            `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/assessments?key=${apiKey}`,
            requestBody
        );

        if (response.data.tokenProperties.valid) {
            console.log(`The reCAPTCHA score is: ${response.data.riskAnalysis.score ?? 'Unknown'}`);
            return true;
        } else {
            console.log(`The CreateAssessment call failed because the token was: ${response.data.tokenProperties.invalidReason ?? 'Unknown reason'}`);
            return false;
        }
    } catch (error) {
        console.error('Error validating reCAPTCHA token:', error);
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
