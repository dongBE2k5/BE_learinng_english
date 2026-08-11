const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Finding and removing 100% duplicate words in 500-TOEIC vocabulary dataset...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const seenKeys = new Set();
        const deduplicatedList = [];
        const removedWordIds = [];
        let duplicateCount = 0;

        for (const w of dataWords) {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc' || w.sub_group?.toLowerCase().includes('story')) {
                const normEn = (w.en || '').toLowerCase().trim();
                const normVi = (w.vi || '').toLowerCase().trim();
                const normCat = (w.category || '').toLowerCase().trim();

                // Unique key defined by EN + VI + POS Category
                const key = `${normEn}|${normVi}|${normCat}`;

                if (seenKeys.has(key)) {
                    duplicateCount++;
                    removedWordIds.push(w.id);
                    console.log(`Removing duplicate #${duplicateCount}: "${w.en}" (${w.category}) - ${w.vi} [ID: ${w.id}]`);
                } else {
                    seenKeys.add(key);
                    deduplicatedList.push(w);
                }
            } else {
                deduplicatedList.push(w);
            }
        }

        console.log(`Total 100% duplicate words removed: ${duplicateCount}`);
        console.log(`Remaining total words in data.json: ${deduplicatedList.length}`);

        // Write back clean deduplicated data.json
        fs.writeFileSync(jsonPath, JSON.stringify(deduplicatedList, null, 2), 'utf8');
        console.log('Successfully saved deduplicated data.json!');

        // Clean up MySQL database
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
        console.error('Error removing duplicates:', err);
    }
})();
