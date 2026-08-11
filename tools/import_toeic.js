const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const text = fs.readFileSync('toeic.txt', 'utf8');
    const lines = text.split(/\r?\n/);
    
    let currentSubGroup = '';
    let currentWord = null;
    const words = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Match heading e.g., "2.1. Contracts (Hợp đồng)"
        const headingMatch = line.match(/^2\.\d+\.\s+(.+)/);
        if (headingMatch) {
            currentSubGroup = headingMatch[1].trim();
            currentWord = null;
            continue;
        }
        
        // Match word line
        const wordMatch = line.match(/^(\d+)\t(.*?)\t(.*?)\t(.*)/);
        if (wordMatch) {
            if (currentWord) {
                words.push(currentWord);
            }
            
            let enRaw = wordMatch[2].trim();
            let ipa = wordMatch[3].trim();
            let vi = wordMatch[4].trim();
            
            // Extract category from enRaw, e.g. "abide by (v)"
            let category = 'Từ vựng';
            let en = enRaw;
            const catMatch = enRaw.match(/^(.*?)\s*\((adj|n|v|adv|n, v|v, n|adj, n|n, adj)\)$/);
            if (catMatch) {
                en = catMatch[1].trim();
                const posStr = catMatch[2];
                if (posStr.includes('n') && posStr.includes('v')) category = 'Danh/Động từ';
                else if (posStr.includes('adj') && posStr.includes('n')) category = 'Danh/Tính từ';
                else if (posStr.includes('v')) category = 'Động từ (v)';
                else if (posStr.includes('n')) category = 'Danh từ (n)';
                else if (posStr.includes('adj')) category = 'Tính từ (adj)';
                else if (posStr.includes('adv')) category = 'Trạng từ (adv)';
            }
            
            currentWord = {
                en: en,
                ipa: ipa,
                vi: vi,
                category: category,
                sub_group: currentSubGroup
            };
            continue;
        }
        
        // Append to previous word meaning if it's not some boilerplate text
        if (currentWord && !line.startsWith('Từ vựng TOEIC') && !line.startsWith('STT') && !line.includes('Xem thêm:') && !line.includes('Để luyện tập thêm')) {
             currentWord.vi += ' / ' + line;
        }
    }
    
    if (currentWord) words.push(currentWord);
    
    console.log(`Parsed ${words.length} words!`);
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'server_learning_english'
    });
    
    let inserted = 0;
    for (const w of words) {
        // unit is null for Master Group words unless specified, but schema says unit INT DEFAULT 1.
        // I will set unit to NULL. Wait, if unit is NOT NULL, I will set it to 1. But wait, I changed DB schema for `unit`? Let me just leave `unit` as null, or omit it. Actually, I will set unit = null to prevent them showing as Unit 1.
        await connection.query(
            'INSERT INTO words (id, en, ipa, vi, category, master_group, sub_group, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [require('crypto').randomUUID(), w.en, w.ipa, w.vi, w.category, '600 Từ Vựng TOEIC', w.sub_group, null]
        );
        inserted++;
    }
    
    console.log(`Inserted ${inserted} words into DB.`);
    await connection.end();
})();
