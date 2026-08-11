const fs = require('fs');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function importFileChunked(connection, filePath, baseSubGroup, chunkSize = 40) {
    console.log(`Processing ${filePath}...`);
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    
    let validWords = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        
        const parts = line.split('\t');
        if (parts.length < 3) continue;
        
        const en = parts[0].trim();
        if (en === 'hi' || en === 'lo' || !en) continue; // skip metadata
        
        const combined = parts[2].trim();
        let ipa = '';
        let vi = combined;
        
        // Extract IPA if it exists. Format: /ipa/ meaning
        const ipaMatch = combined.match(/^\/([^\/]+)\/\s*(.*)$/);
        if (ipaMatch) {
            ipa = `/${ipaMatch[1]}/`;
            vi = ipaMatch[2].trim();
        }
        
        validWords.push({ en, ipa, vi });
    }
    
    console.log(`Found ${validWords.length} valid words in ${filePath}. Splitting into chunks of ${chunkSize}...`);
    
    let count = 0;
    let part = 1;
    for (let i = 0; i < validWords.length; i += chunkSize) {
        const chunk = validWords.slice(i, i + chunkSize);
        const subGroup = `${baseSubGroup} - Phần ${part}`;
        
        for (const w of chunk) {
            await connection.query(
                'INSERT INTO words (id, en, ipa, vi, master_group, sub_group, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [crypto.randomUUID(), w.en, w.ipa, w.vi, 'Từ Vựng ETS 2026', subGroup, null]
            );
            count++;
        }
        part++;
    }
    console.log(`Finished importing ${count} words from ${filePath} into chunks.`);
}

(async () => {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'english_learning'
        });
        
        console.log("Deleting old monolithic imports...");
        await connection.query("DELETE FROM words WHERE master_group = 'Từ Vựng ETS 2026' AND (sub_group = '800 từ vựng LC ETS 2026' OR sub_group = '800 từ vựng RC ETS 2026')");
        console.log("Old imports deleted.");

        await importFileChunked(connection, '800 tu vung LC ets2026.txt', '800 từ vựng LC ETS 2026', 40);
        await importFileChunked(connection, '800 tu vung RC ets2026.txt', '800 từ vựng RC ETS 2026', 40);
        
        console.log("All chunked imports completed successfully.");
    } catch (err) {
        console.error('Database connection or import error:', err);
    } finally {
        if (connection) await connection.end();
    }
})();
