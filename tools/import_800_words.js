const fs = require('fs');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function importFile(connection, filePath, subGroup) {
    console.log(`Importing ${filePath}...`);
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    
    let count = 0;
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
        
        await connection.query(
            'INSERT INTO words (id, en, ipa, vi, master_group, sub_group, unit) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), en, ipa, vi, 'Từ Vựng ETS 2026', subGroup, null]
        );
        count++;
    }
    console.log(`Finished importing ${count} words from ${filePath} into ${subGroup}`);
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
        
        await importFile(connection, '800 tu vung LC ets2026.txt', '800 từ vựng LC ETS 2026');
        await importFile(connection, '800 tu vung RC ets2026.txt', '800 từ vựng RC ETS 2026');
        
        console.log("All imports completed successfully.");
    } catch (err) {
        console.error('Database connection or import error:', err);
    } finally {
        if (connection) await connection.end();
    }
})();
