import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

export default function db() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error acquiring MySQL connection:', err);
            return;
        }
        console.log('Connected to MySQL database');
        connection.release();
    });

    return pool;
}