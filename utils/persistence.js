import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

export async function readData(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn(`File ${filename} not found, returning empty array.`);
            return [];
        }
        throw error;
    }
}

export async function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        // Ensure dir exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Write atomically (basic version)
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing to ${filename}:`, error);
        throw error;
    }
}
