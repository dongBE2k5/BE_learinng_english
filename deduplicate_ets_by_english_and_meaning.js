const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Deep scanning ETS/TOEIC curriculum dataset for identical words (EN + VI)...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const seenEnVi = new Set();
        const deduplicatedList = [];
        const removedWordIds = [];
        let duplicateCount = 0;

        for (const w of dataWords) {
            // Focus on non-500 ETS curriculum words
            const isEtsCourseWord = w.master_group !== '500 Từ Vựng TOEIC Mất Gốc';

            if (isEtsCourseWord) {
                const normEn = (w.en || '').toLowerCase().trim();
                const normVi = (w.vi || '').toLowerCase().trim();

                const key = `${normEn}|${normVi}`;

                if (seenEnVi.has(key)) {
                    duplicateCount++;
                    if (w.id) removedWordIds.push(w.id);
                    console.log(`Removing ETS duplicate #${duplicateCount}: "${w.en}" [${w.category || 'N/A'}] - "${w.vi}" (ID: ${w.id || 'N/A'})`);
                } else {
                    seenEnVi.add(key);
                    deduplicatedList.push(w);
                }
            } else {
                deduplicatedList.push(w);
            }
        }

        console.log(`Total duplicate ETS words removed by (EN + VI): ${duplicateCount}`);
        console.log(`Remaining total words in data.json: ${deduplicatedList.length}`);

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
        console.error('Error deep scanning ETS duplicates:', err);
    }
})();
