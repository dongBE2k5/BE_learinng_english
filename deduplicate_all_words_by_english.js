const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Strict deduplication by English word spelling across entire dataset...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const seenEn = new Set();
        const deduplicatedList = [];
        const removedWordIds = [];
        let duplicateCount = 0;

        for (const w of dataWords) {
            if (!w.en) continue;
            const normEn = w.en.toLowerCase().trim();

            if (seenEn.has(normEn)) {
                duplicateCount++;
                if (w.id) removedWordIds.push(w.id);
                console.log(`Removing duplicate #${duplicateCount}: "${w.en}" [Sub: ${w.sub_group || 'N/A'}] - "${w.vi}" (ID: ${w.id || 'N/A'})`);
            } else {
                seenEn.add(normEn);
                deduplicatedList.push(w);
            }
        }

        console.log(`Total duplicate words removed by English word: ${duplicateCount}`);
        console.log(`Remaining total unique words in data.json: ${deduplicatedList.length}`);

        // Save cleaned data.json
        fs.writeFileSync(jsonPath, JSON.stringify(deduplicatedList, null, 2), 'utf8');
        console.log('Successfully saved cleaned data.json!');

        // Update MySQL DB
        if (removedWordIds.length > 0) {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '123456',
                database: process.env.DB_NAME || 'server_learning_english'
            });

            for (const id of removedWordIds) {
                if (id) {
                    await connection.query('DELETE FROM words WHERE id = ?', [id]);
                }
            }
            console.log(`Successfully deleted ${removedWordIds.length} duplicate rows from MySQL database!`);
            await connection.end();
        }

    } catch (err) {
        console.error('Error strictly deduplicating words:', err);
    }
})();
