import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';
import { menu } from '../data/menu.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE_IMAGES_PATH = 'C:\\Users\\Project_Genesis\\Desktop\\Developer-Roadmap\\fast-pizza\\public';

// Configure Cloudinary explicitly for the script
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        // Drop existing tables to ensure schema update
        await query('DROP TABLE IF EXISTS menu cascade');
        await query(schema);
        console.log('Schema created.');

        // Seed menu if empty
        const menuCheck = await query('SELECT count(*) FROM menu');
        if (parseInt(menuCheck.rows[0].count) === 0) {
            console.log('Seeding menu with automatic image upload...');

            for (const item of menu) {
                let imageUrl = item.image; // Default to path from file if upload fails

                try {
                    // item.image is like '/images/pizzas/katana-margherita.png'
                    // We need to construct full path: SOURCE_IMAGES_PATH + item.image
                    // Be careful with slashes in Windows
                    const relativePath = item.image.replace(/\//g, path.sep); // Convert / to \
                    const fullLocalPath = path.join(SOURCE_IMAGES_PATH, relativePath);

                    if (fs.existsSync(fullLocalPath)) {
                        console.log(`Uploading ${item.name} image...`);
                        const uploadResult = await cloudinary.uploader.upload(fullLocalPath, {
                            folder: 'menu-items',
                            public_id: item.id, // Use item ID as public ID to avoid duplicates
                            overwrite: true
                        });
                        imageUrl = uploadResult.secure_url;
                        console.log(`✓ Uploaded: ${imageUrl}`);
                    } else {
                        console.warn(`⚠️ Image file not found at: ${fullLocalPath}`);
                    }
                } catch (uploadDetail) {
                    console.error(`❌ Failed to upload image for ${item.name}:`, uploadDetail.message);
                    // Proceed with original path if upload fails
                }

                await query(
                    'INSERT INTO menu (name, description, unit_price, image_url, ingredients, category, spicy, vegetarian, bestseller, sold_out) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
                    [
                        item.name,
                        item.description,
                        item.price,
                        imageUrl,
                        JSON.stringify(item.ingredients),
                        item.category,
                        item.spicy || false,
                        item.vegetarian || false,
                        item.bestseller || false,
                        !item.available
                    ]
                );
            }
            console.log('Menu seeded.');
            console.log('Menu seeded.');
        }

        // Seed admin user if not exists
        const adminCheck = await query("SELECT * FROM users WHERE email = $1", ['noureddine@samuraipizza.com']);
        if (adminCheck.rows.length === 0) {
            console.log('Seeding admin user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Noureddine', 'noureddine@samuraipizza.com', hashedPassword, 'admin']
            );
            console.log('Admin user seeded (noureddine@samuraipizza.com / admin123).');
        }

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize database:', err);
    } finally {
        process.exit();
    }
}

initDb();
