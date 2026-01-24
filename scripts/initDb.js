import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await query(schema);
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    } finally {
        process.exit();
    }
}

initDb();
