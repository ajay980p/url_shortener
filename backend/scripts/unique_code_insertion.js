dotenv.config();
import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';


const TOTAL_KEYS = 1_000_000;
const BATCH_SIZE = 1000;
const SHORT_CODE_LENGTH = 8;

async function insertNanoIDs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const uniqueCodes = new Set();

    console.log(`Generating ${TOTAL_KEYS} unique short codes...`);

    // Step 1: Generate 1M unique codes
    while (uniqueCodes.size < TOTAL_KEYS) {
        uniqueCodes.add(nanoid(SHORT_CODE_LENGTH));
    }

    console.log('Finished generating. Now inserting into DB...');

    const codesArray = Array.from(uniqueCodes);

    for (let i = 0; i < TOTAL_KEYS; i += BATCH_SIZE) {
        const batch = codesArray.slice(i, i + BATCH_SIZE);
        const values = batch.map(code => [code]);

        await connection.query(
            'INSERT INTO short_url (short_code) VALUES ?',
            [values]
        );

        console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    }

    await connection.end();
    console.log('✅ All 10 lakh codes inserted successfully!');
}

insertNanoIDs().catch(err => {
    console.error('❌ Error inserting nanoid codes:', err);
});