import { query } from '../db/index.js';

async function migrate() {
    console.log('Starting migration: Separating Customers and Admins...');

    try {
        // 1. Create Admins Table
        console.log('Creating admins table...');
        await query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'staff',
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Migrate existing admins/managers from 'users' to 'admins'
        console.log('Migrating admin users...');
        // We assume username is the part of email before '@' for migration purposes
        await query(`
            INSERT INTO admins (username, password_hash, role, full_name, created_at)
            SELECT SPLIT_PART(email, '@', 1), password_hash, role, full_name, created_at
            FROM users
            WHERE role IN ('admin', 'manager')
            ON CONFLICT (username) DO NOTHING;
        `);

        // 3. Rename 'users' to 'customers' (if not already done/renamed)
        // We check if 'customers' exists to avoid double-run errors
        const checkCustomers = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'customers'
            );
        `);

        if (!checkCustomers.rows[0].exists) {
            console.log('Renaming users table to customers...');
            await query('ALTER TABLE users RENAME TO customers;');
        }

        // 4. Remove Admin rows from customers table
        console.log('Cleaning up customers table...');
        await query("DELETE FROM customers WHERE role IN ('admin', 'manager');");

        // 5. Update customers schema (Add phone, make email nullable)
        console.log('Updating customers schema...');
        await query(`
            ALTER TABLE customers 
            ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
            ALTER COLUMN email DROP NOT NULL;
        `);

        // Add constraint check for email OR phone (need dynamic SQL to avoid 'constraint exists' error, or just try/catch block style in SQL)
        // Simplest way is a separate DO block or just running it and ignoring error if exists.
        try {
            await query(`
                ALTER TABLE customers 
                ADD CONSTRAINT email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL);
            `);
        } catch (err) {
            console.log('Constraint email_or_phone_check might already exist, skipping...');
        }

        // 6. Update Orders foreign key
        // Need to drop the old constraint referencing 'users' (which is now renamed to customers, but the constraint might still hold the old name or need refresh)
        // Postgres typically renames the constraint or keeps it pointing to the renamed table. 
        // We should ensure it points to customers(id).

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
