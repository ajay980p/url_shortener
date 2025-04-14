const express = require('express');
const router = express.Router();
const shortid = require('shortid');
const db = require('../config/db');

const connection = db();

router.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;
    const shortCode = shortid.generate();
    const shortUrl = `${process.env.REDIRECTION_URL}/s/${shortCode}`;

    try {
        const query = 'INSERT INTO short_url (long_url, short_code, short_url) VALUES (?, ?, ?)';
        await connection.promise().query(query, [longUrl, shortCode, shortUrl]);
        res.json({ shortUrl });
    } catch (err) {
        console.error('Error creating short URL:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


router.get('/s/:shortCode', async (req, res) => {
    const { shortCode } = req.params;

    try {
        const query = 'SELECT long_url FROM short_url WHERE short_code = ?';
        const [results] = await connection.promise().query(query, [shortCode]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'URL not found' });
        }

        res.redirect(results[0].long_url);
    } catch (err) {
        console.error('Error fetching URL:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;