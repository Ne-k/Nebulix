import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import multer from 'multer';
import { config } from 'dotenv';
config();

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const encodeBase64 = (str: string) => {
    return Buffer.from(str).toString('base64');
};

const upload = multer();

const getApiUrl = (endpoint: any) => {
    return `${window.location.origin}${endpoint}`;
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

            const recaptchaValidationResponse = await axios.post(
                getApiUrl('/api/recaptchaHandler'),
                { recaptchaToken }
            );

            if (recaptchaValidationResponse.status !== 200) {
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

            await axios.post(
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

            res.status(200).send('Message sent');
        });
    } catch (error: unknown) {
        const typedError = error as any;
        res.status(500).send({ error: 'Server Error', details: typedError.message });
    }
};

export default handler;
