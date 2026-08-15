const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    port: process.env.DB_PORT || 3306
};

const DB_NAME = process.env.DB_NAME || 'server_learning_english';

let pool;

async function initDB() {
    try {
        // Create DB if not exists
        const connection = await mysql.createConnection(dbConfig);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.end();

        // Create Pool
        pool = mysql.createPool({
            ...dbConfig,
            database: DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Create Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS words (
                id VARCHAR(100) PRIMARY KEY,
                en VARCHAR(255) NOT NULL,
                vi VARCHAR(255) NOT NULL,
                ipa VARCHAR(100),
                category VARCHAR(100),
                unit INT,
                master_group VARCHAR(100) DEFAULT NULL,
                sub_group VARCHAR(100) DEFAULT NULL,
                definition_en TEXT DEFAULT NULL,
                definition_vi TEXT DEFAULT NULL,
                example_en TEXT DEFAULT NULL,
                example_vi TEXT DEFAULT NULL,
                collocations TEXT DEFAULT NULL,
                mnemonics TEXT DEFAULT NULL,
                context_passage TEXT DEFAULT NULL,
                io_prompt TEXT DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Safely try to alter existing table if these columns don't exist
        try {
            await pool.query('ALTER TABLE words ADD COLUMN master_group VARCHAR(100) DEFAULT NULL');
        } catch (e) { /* Column might already exist */ }
        
        try {
            await pool.query('ALTER TABLE words ADD COLUMN sub_group VARCHAR(100) DEFAULT NULL');
        } catch (e) { /* Column might already exist */ }

        try { await pool.query('ALTER TABLE words ADD COLUMN definition_en TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN definition_vi TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN example_en TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN example_vi TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN collocations TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN mnemonics TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN context_passage TEXT DEFAULT NULL'); } catch(e){}
        try { await pool.query('ALTER TABLE words ADD COLUMN io_prompt TEXT DEFAULT NULL'); } catch(e){}

        // Check if data exists
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM words');
        if (rows[0].count === 0) {
            console.log('Table is empty. Seeding from data.json...');
            const dataPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
            
            if (fs.existsSync(dataPath)) {
                const rawData = fs.readFileSync(dataPath, 'utf8');
                const words = JSON.parse(rawData);
                
                let count = 0;
                for (const word of words) {
                    const wordId = word.id || `word-${count}-${Date.now()}`;
                    await pool.query(
                        'INSERT INTO words (id, en, vi, ipa, category, unit, master_group, sub_group, definition_en, definition_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)',
                        [wordId, word.en, word.vi, word.ipa || '', word.category || '', word.unit || 1, word.master_group || null, word.sub_group || null]
                    );
                    count++;
                }
                console.log(`Successfully seeded ${count} words.`);
            } else {
                console.log('data.json not found at ' + dataPath);
            }
        } else {
            console.log('Database already has data. Skipping seed.');
        }

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}

function getPool() {
    return pool;
}

module.exports = {
    initDB,
    getPool
};
