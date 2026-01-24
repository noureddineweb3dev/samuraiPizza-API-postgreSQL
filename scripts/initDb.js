import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';
import { menu } from '../data/menu.js';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await query(schema);
        console.log('Schema created.');

        // Seed menu if empty
        const menuCheck = await query('SELECT count(*) FROM menu');
        if (parseInt(menuCheck.rows[0].count) === 0) {
            console.log('Seeding menu...');
            for (const item of menu) {
                await query(
                    'INSERT INTO menu (name, unit_price, image_url, ingredients, sold_out) VALUES ($1, $2, $3, $4, $5)',
                    [item.name, item.unitPrice, item.imageUrl, JSON.stringify(item.ingredients), item.soldOut]
                );
            }
            console.log('Menu seeded.');
        }

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    } finally {
        process.exit();
    }
}

initDb();
