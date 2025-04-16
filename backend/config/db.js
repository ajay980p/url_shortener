import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

function initializeDb() {
    if (pool) {
        return pool;
    }

    console.log('Initializing MySQL connection pool...');
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: process.env.DB_POOL_LIMIT,
            queueLimit: 0,
            connectTimeout: 10000
        });

        pool.getConnection()
            .then(connection => {
                console.log('Successfully connected test connection to MySQL database.');
                connection.release();
            })
            .catch(err => {
                console.error('Error testing MySQL connection during initialization:', err);
            });

        console.log('MySQL connection pool successfully created.');
        return pool;

    } catch (error) {
        console.error('FATAL: Failed to create MySQL connection pool:', error);
        pool = null;
        throw error;
    }
}

export default initializeDb;