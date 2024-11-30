import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { config } from "dotenv";
import rateLimit from 'express-rate-limit';
import cookie from 'cookie';
import { v4 as uuidv4 } from 'uuid';

config();

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const encodeBase64 = (str: string) => {
    return Buffer.from(str).toString('base64');
};

const getClientIdFromCookies = (req: VercelRequest): string | null => {
    const cookies = cookie.parse(req.headers.cookie || '');
    return cookies['client_id'] || null;
};

const clientRateLimiters = new Map<string, ReturnType<typeof rateLimit>>();

const createRateLimiter = () => rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 2,
    handler: (_req, res) => {
        res.status(429).send('Too many requests from this client, please try again later.');
    }
});

const parseRequestBody = (req: VercelRequest) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
    });
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const discordBotToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_CHANNEL_ID;

    let clientId = getClientIdFromCookies(req);

    if (!clientId) {
        clientId = uuidv4();
        res.setHeader('Set-Cookie', cookie.serialize('client_id', clientId, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        }));
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
            const body = await parseRequestBody(req) as any;
            console.log('Request Body:', body);

            const name = capitalizeWords(body.name);
            const team = body.team;
            const sanitizedContact = body.contact.replace(/[\s-]/g, '_');
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
                    \`${name}\` from \`${team}\` would like to trade \`${body.offer}\` for \`${body.tradeFor}\`.
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
