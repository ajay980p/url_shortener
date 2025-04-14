import express from 'express';
import { nanoid } from 'nanoid';
import validUrl from 'valid-url';
import db from '../config/db.js';

const router = express.Router();
const connection = db();

router.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;

    // if (!validUrl.isWebUri(longUrl)) {
    //     return res.status(400).json({ error: 'Invalid URL' });
    // }

    let shortCode;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        shortCode = nanoid(8); // 8-character random ID
        const shortUrl = `${process.env.REDIRECTION_URL}/s/${shortCode}`;

        try {
            const query = 'INSERT INTO short_url (long_url, short_code, short_url) VALUES (?, ?, ?)';
            await connection.promise().query(query, [longUrl, shortCode, shortUrl]);
            return res.json({ shortUrl });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                attempts++;
                continue;
            }
            console.error('Error creating short URL:', err);
            return res.status(500).json({ error: 'Database error' });
        }
    }
    res.status(500).json({ error: 'Failed to generate unique short code' });
});

router.get('/s/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const query = 'SELECT long_url FROM short_url WHERE short_code = ?';
        const [results] = await connection.promise().query(query, [shortCode]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'URL not found' });
        }

        res.redirect(301, results[0].long_url);
    } catch (err) {
        console.error('Error fetching URL:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;