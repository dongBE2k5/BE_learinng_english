const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Manual mapping for clean English words from the source markdown entries
const cleanWordMap = {
    "breach (the contract)": "breach",
    "enclose/attach": "enclose",
    "comply with/abide by/adhere to": "comply with",
    "invoice/receipt": "invoice",
    "seminar/workshop": "seminar",
    "disclose/reveal": "disclose",
    "assess/evaluate": "assess",
    "launch/release": "launch",
    "meet/accommodate": "meet",
    "delay/postpone": "delay",
    "reliable/dependable": "reliable",
    "reasonable price/rate": "reasonable price",
    "defective (sản phẩm bị lỗi)": "defective"
};

(async () => {
    try {
        console.log('Cleaning import errors (removing parentheses & slashes from word titles)...');

        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        let cleanedCount = 0;

        dataWords = dataWords.map(w => {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc' || w.sub_group?.toLowerCase().includes('story')) {
                const originalEn = w.en.trim();

                // Check explicit map first
                if (cleanWordMap[originalEn]) {
                    w.en = cleanWordMap[originalEn];
                    cleanedCount++;
                } else if (originalEn.includes('(') || originalEn.includes('/')) {
                    // Auto clean parentheses e.g. "word (note)" -> "word"
                    let clean = originalEn.replace(/\(.*?\)/g, '').trim();

                    // Auto clean slashes e.g. "word1/word2" -> "word1"
                    if (clean.includes('/')) {
                        clean = clean.split('/')[0].trim();
                    }

                    if (clean && clean !== originalEn) {
                        w.en = clean;
                        cleanedCount++;
                    }
                }
            }
            return w;
        });

        // Write back clean data.json
        fs.writeFileSync(jsonPath, JSON.stringify(dataWords, null, 2), 'utf8');
        console.log(`Cleaned ${cleanedCount} word titles in data.json!`);

        // Update Database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        for (const w of dataWords) {
            if (w.master_group === '500 Từ Vựng TOEIC Mất Gốc') {
                await connection.query(
                    'UPDATE words SET en = ?, category = ?, ipa = ? WHERE id = ?',
                    [w.en, w.category, w.ipa, w.id]
                );
            }
        }

        console.log('Successfully updated MySQL database with clean word titles!');
        await connection.end();
    } catch (err) {
        console.error('Error cleaning words:', err);
    }
})();
