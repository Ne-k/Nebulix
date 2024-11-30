import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { config } from "dotenv";
import rateLimit from 'express-rate-limit';

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

const createRateLimiter = () => rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 2,
    handler: (_req, res) => {
        res.status(429).send('Too many requests from this client, please try again later.');
    }
});

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    const clientId = getClientId(req);
    if (!clientId) {
        // return res.status(400).send('Client ID header missing');
        return 0
    }

    if (!clientRateLimiters.has(clientId)) {
        clientRateLimiters.set(clientId, createRateLimiter());
    }

    const limiter = clientRateLimiters.get(clientId);
    if (!limiter) {
        return res.status(500).send('Rate limiter initialization error');
    }

    limiter(req as any, res as any, async () => {
        try {
            const name = capitalizeWords(req.body.name);
            const team = req.body.team;
            const sanitizedContact = req.body.contact.replace(/[\s-]/g, '_');
            const encodedContact = encodeBase64(sanitizedContact);

            const threadResponse = await axios.post(
                `https://discord.com/api/v9/channels/${channelId}/threads`,
                {
                    name: `New Trade Request: ${name} From ${team}`,
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
                    \`${name}\` from \`${team}\` would like to trade \`${req.body.offer}\` for \`${req.body.tradeFor}\`.
                    **Contact Information:** [Revealed when you claim the trade]
                `,
                color: 3447003,
                footer: {
                    text: `${encodeBase64(encodedContact)}`
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
        } catch (error: unknown) {
            console.error('Error:', error);
            res.status(500).send({ error: 'Server Error', details: error });
        }
    });
};

module.exports = handler;