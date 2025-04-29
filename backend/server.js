import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import urlRoutes from './routes/url.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', urlRoutes);

app.get("/", (req, res) => {
    return res.json({ success: true })
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    db();
    console.log(`Server running on port ${PORT}`);
});