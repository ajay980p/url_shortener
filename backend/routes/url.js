import express from 'express';
import initializeDb from '../config/db.js';

const router = express.Router();
const pool = initializeDb();

if (!pool) {
    throw new Error("Database pool is not available in URL routes.");
}

router.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;
    if (!longUrl) {
        return res.status(400).json({ error: 'longUrl is required' });
    }

    const redirectionBase = process.env.REDIRECTION_URL || 'http://localhost:5000';

    const connection = await pool.getConnection();
    try {
        try {
            await connection.beginTransaction();

            // Step 1: Get one unused key with locking to avoid race conditions
            const [rows] = await connection.query(
                `SELECT id, short_code FROM short_url 
                 WHERE is_used = 0 
                 LIMIT 1 
                 FOR UPDATE SKIP LOCKED`
            );

            if (rows.length === 0) {
                await connection.rollback();
                return res.status(500).json({ error: 'No available short codes. Pool exhausted!' });
            }

            const { id, short_code } = rows[0];
            const shortUrl = `${redirectionBase}/s/${short_code}`;

            // Step 2: Update the entry with long_url, short_url, and mark it used
            await connection.query(
                `UPDATE short_url 
                 SET long_url = ?, short_url = ?, is_used = 1, created_at = NOW() 
                 WHERE id = ?`,
                [longUrl, shortUrl, id]
            );

            await connection.commit();
            connection.release();

            console.log(`[KGS] Shortened ${longUrl} → ${shortUrl}`);
            res.status(201).json({ shortUrl });

        } catch (err) {
            await connection.rollback();
            connection.release();
            console.error('[Transaction Error]', err);
            res.status(500).json({ error: 'Error creating short URL' });
        }
    } catch (err) {
        connection.release();
        console.error('[DB Connection Error]', err);
        res.status(500).json({ error: 'Database error' });
    }
});




// router.get('/s/:shortCode', async (req, res) => {
//     const { shortCode } = req.params;

//     try {
//         const query = 'SELECT long_url FROM short_url WHERE short_code = ?';
//         const [results] = await connection.query(query, [shortCode]);

//         if (results.length === 0) {
//             return res.status(404).json({ error: 'URL not found' });
//         }

//         res.redirect(301, results[0].long_url);
//     } catch (err) {
//         console.error('Error fetching URL:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

export default router;