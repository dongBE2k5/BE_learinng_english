const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

(async () => {
    try {
        const mdPath = path.join(__dirname, '500-tu-vung-toeic.md');
        const text = fs.readFileSync(mdPath, 'utf8');
        const lines = text.split(/\r?\n/);

        let currentStory = '';
        let storyIndex = 0;
        const words = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Match heading: ## Story 1: Khi Tin gặp sếp xin nghỉ làm
            const storyMatch = line.match(/^##\s+Story\s+(\d+)[:\s]+(.+)/i);
            if (storyMatch) {
                storyIndex = parseInt(storyMatch[1], 10);
                const storyNumStr = storyIndex < 10 ? `0${storyIndex}` : `${storyIndex}`;
                currentStory = `Story ${storyNumStr}: ${storyMatch[2].trim()}`;
                continue;
            }

            // Match table row: | 1 | surprised | ngạc nhiên |
            const tableMatch = line.match(/^\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
            if (tableMatch && currentStory) {
                const enRaw = tableMatch[2].trim();
                const viRaw = tableMatch[3].trim();

                if (enRaw === 'Từ vựng' || enRaw === '---') continue;

                // Extract category if in enRaw, e.g. "(v)" or "(adj)"
                let category = 'Từ vựng';
                let en = enRaw;
                const posMatch = enRaw.match(/^(.*?)\s*\((adj|n|v|adv)\)$/i);
                if (posMatch) {
                    en = posMatch[1].trim();
                    const p = posMatch[2].toLowerCase();
                    if (p === 'v') category = 'Động từ (v)';
                    else if (p === 'n') category = 'Danh từ (n)';
                    else if (p === 'adj') category = 'Tính từ (adj)';
                    else if (p === 'adv') category = 'Trạng từ (adv)';
                }

                // Simple IPA placeholder or clean string if needed
                const id = `500-story${storyIndex}-${tableMatch[1]}-${Date.now()}-${Math.floor(Math.random()*1000)}`;

                words.push({
                    id,
                    en: en,
                    vi: viRaw,
                    ipa: '', // Will update or default
                    category,
                    master_group: '500 Từ Vựng TOEIC Mất Gốc',
                    sub_group: currentStory,
                    unit: storyIndex
                });
            }
        }

        console.log(`Parsed ${words.length} words across ${storyIndex} stories from 500-tu-vung-toeic.md`);

        // Connect to Database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '123456',
            database: process.env.DB_NAME || 'server_learning_english'
        });

        // Delete existing 500 words to avoid duplicates if re-running
        await connection.query("DELETE FROM words WHERE master_group = '500 Từ Vựng TOEIC Mất Gốc'");

        let inserted = 0;
        for (const w of words) {
            await connection.query(
                'INSERT INTO words (id, en, vi, ipa, category, unit, master_group, sub_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [w.id, w.en, w.vi, w.ipa, w.category, w.unit, w.master_group, w.sub_group]
            );
            inserted++;
        }

        console.log(`Successfully inserted ${inserted} words into database!`);
        await connection.end();

        // Also update data.json seeding file if present
        const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
        if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, 'utf8');
            let dataWords = JSON.parse(raw);
            // Remove old 500 words
            dataWords = dataWords.filter(w => w.master_group !== '500 Từ Vựng TOEIC Mất Gốc');
            // Add new words
            dataWords.push(...words);
            fs.writeFileSync(jsonPath, JSON.stringify(dataWords, null, 2), 'utf8');
            console.log(`Updated client data.json with ${words.length} 500-TOEIC words.`);
        }

    } catch (err) {
        console.error('Error importing 500 words:', err);
    }
})();
