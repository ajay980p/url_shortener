import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import urlRoutes from './routes/url.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', urlRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    db();
    console.log(`Server running on port ${PORT}`);
});