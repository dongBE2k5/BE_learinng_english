const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Force syncing MySQL database with latest data.json...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        const dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        let updated = 0;
        for (const w of dataWords) {
            await connection.query(
                'INSERT INTO words (id, en, vi, ipa, category, unit, master_group, sub_group, definition_en, definition_vi, example_en, example_vi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE en=VALUES(en), vi=VALUES(vi), ipa=VALUES(ipa), category=VALUES(category), unit=VALUES(unit), master_group=VALUES(master_group), sub_group=VALUES(sub_group), definition_en=VALUES(definition_en), definition_vi=VALUES(definition_vi), example_en=VALUES(example_en), example_vi=VALUES(example_vi)',
                [w.id, w.en, w.vi, w.ipa || '', w.category || '', w.unit || null, w.master_group || null, w.sub_group || null, w.definition_en || null, w.definition_vi || null, w.example_en || null, w.example_vi || null]
            );
            updated++;
        }

        console.log(`Successfully synced ${updated} words into MySQL database!`);
        await connection.end();
    } catch (err) {
        console.error('Database sync failed:', err);
    }
})();
