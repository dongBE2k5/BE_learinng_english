const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        console.log('Syncing Minna No Nihongo dataset into data.json and MySQL database...');

        const minnaJsonPath = path.join(__dirname, 'minna_50_lessons.json');
        if (!fs.existsSync(minnaJsonPath)) {
            console.log('minna_50_lessons.json not found!');
            return;
        }

        const minnaWords = JSON.parse(fs.readFileSync(minnaJsonPath, 'utf8'));
        const mainJsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        let mainData = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));

        // Filter out existing Japanese words to avoid duplicates
        const nonJapaneseWords = mainData.filter(w => w.master_group !== 'Từ Vựng Tiếng Nhật Minna No Nihongo');

        // Combined dataset
        const mergedData = [...nonJapaneseWords, ...minnaWords];

        fs.writeFileSync(mainJsonPath, JSON.stringify(mergedData, null, 2), 'utf8');
        console.log(`Successfully merged ${minnaWords.length} Japanese words into data.json! (Total: ${mergedData.length})`);

        // Sync into MySQL DB
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        let inserted = 0;
        for (const w of minnaWords) {
            const wordEn = w.kanji ? `${w.kanji} (${w.hiragana || w.romaji})` : (w.hiragana || w.romaji || '');
            await connection.query(
                'INSERT INTO words (id, en, vi, ipa, category, unit, master_group, sub_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE en=VALUES(en), vi=VALUES(vi), ipa=VALUES(ipa), category=VALUES(category), unit=VALUES(unit), master_group=VALUES(master_group), sub_group=VALUES(sub_group)',
                [w.id, wordEn, w.vi, w.romaji ? `[${w.romaji}]` : '', w.category || 'Từ vựng', null, w.master_group, w.sub_group]
            );
            inserted++;
        }

        console.log(`Successfully synced ${inserted} Japanese words into MySQL database!`);
        await connection.end();
    } catch (err) {
        console.error('Sync Minna error:', err);
    }
})();
