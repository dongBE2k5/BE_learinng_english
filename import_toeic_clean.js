const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    // 1. Read and Parse toeic.txt
    const text = fs.readFileSync('toeic.txt', 'utf8');
    const lines = text.split(/\r?\n/);
    
    let currentSubGroup = '';
    const parsedWords = [];
    let currentWord = null;
    
    function isGarbageLine(line) {
        const l = line.toLowerCase();
        if (l.startsWith('stt')) return true;
        if (l.startsWith('từ vựng toeic')) return true;
        if (l.includes('xem thêm')) return true;
        if (l.includes('để luyện tập')) return true;
        if (l.includes('ôn tập thêm')) return true;
        if (l.includes('sau khi tìm hiểu')) return true;
        if (l.includes('bạn có thích')) return true;
        if (l.includes('trong bộ 600')) return true;
        if (l.includes('đến đây, bạn đã')) return true;
        if (l.includes('trước tiên, hãy cùng')) return true;
        if (l.includes('chú thích:')) return true;
        if (l.startsWith('(v) – verb') || l.startsWith('(n) – noun') || l.startsWith('(adj) – adj') || l.startsWith('(adv) – adv') || l.startsWith('(pre) – pre')) return true;
        return false;
    }
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // Match heading e.g., "2.1. Contracts (Hợp đồng)"
        const headingMatch = line.match(/^2\.\d+\.\s+(.+)/);
        if (headingMatch) {
            if (currentWord) {
                parsedWords.push(currentWord);
                currentWord = null;
            }
            currentSubGroup = headingMatch[1].trim();
            continue;
        }
        
        // Match a line starting with a number
        const numberMatch = line.match(/^(\d+)\s+(.*)/);
        if (numberMatch) {
            if (currentWord) {
                parsedWords.push(currentWord);
            }
            
            const stt = parseInt(numberMatch[1], 10);
            const rest = numberMatch[2].trim();
            
            let parts = rest.split(/\t+/);
            if (parts.length < 2) {
                parts = rest.split(/ {2,}/);
            }
            
            currentWord = {
                stt: stt,
                rawParts: parts,
                subGroup: currentSubGroup,
                lineNum: i + 1
            };
        } else {
            // Continuation line
            if (currentWord && !isGarbageLine(line)) {
                let parts = line.split(/\t+/);
                if (parts.length < 2) {
                    parts = line.split(/ {2,}/);
                }
                
                if (parts.length >= 2 && (line.includes('(') || parts[0].includes('somebody') || parts[0].includes('something'))) {
                    // Complete English word and Vietnamese meaning
                    currentWord.rawParts[0] = (currentWord.rawParts[0] + ' ' + parts[0]).trim();
                    for (let p = 1; p < parts.length; p++) {
                        currentWord.rawParts.push(parts[p]);
                    }
                } else {
                    // Continuation of meaning
                    if (currentWord.rawParts.length > 0) {
                        const lastIdx = currentWord.rawParts.length - 1;
                        currentWord.rawParts[lastIdx] = currentWord.rawParts[lastIdx] + ' / ' + line;
                    }
                }
            }
        }
    }
    
    if (currentWord) {
        parsedWords.push(currentWord);
    }
    
    console.log(`Parsed ${parsedWords.length} words from toeic.txt.`);
    
    // Process raw parts into clean fields
    const processedWords = parsedWords.map(w => {
        let enRaw = w.rawParts[0] ? w.rawParts[0].trim() : '';
        let ipa = '';
        let vi = '';
        
        if (w.rawParts.length === 3) {
            ipa = w.rawParts[1].trim();
            vi = w.rawParts[2].trim();
        } else if (w.rawParts.length === 2) {
            vi = w.rawParts[1].trim();
        } else if (w.rawParts.length > 3) {
            const ipaIdx = w.rawParts.findIndex(p => p.startsWith('/') && p.endsWith('/'));
            if (ipaIdx !== -1) {
                ipa = w.rawParts[ipaIdx].trim();
                enRaw = w.rawParts.slice(0, ipaIdx).join(' ').trim();
                vi = w.rawParts.slice(ipaIdx + 1).join(' / ').trim();
            } else {
                vi = w.rawParts.slice(1).join(' / ').trim();
            }
        } else {
            vi = w.rawParts.join(' / ').trim();
        }
        
        // Clean up category
        let category = 'Từ vựng';
        let en = enRaw;
        const catMatch = enRaw.match(/^(.*?)\s*\((adj|n|v|adv|n, v|v, n|adj, n|n, adj|pre|idiom)\)$/);
        if (catMatch) {
            en = catMatch[1].trim();
            const posStr = catMatch[2];
            if (posStr.includes('n') && posStr.includes('v')) category = 'Danh/Động từ';
            else if (posStr.includes('adj') && posStr.includes('n')) category = 'Danh/Tính từ';
            else if (posStr.includes('v')) category = 'Động từ (v)';
            else if (posStr.includes('n')) category = 'Danh từ (n)';
            else if (posStr.includes('adj')) category = 'Tính từ (adj)';
            else if (posStr.includes('adv')) category = 'Trạng từ (adv)';
            else if (posStr === 'pre') category = 'Giới từ (pre)';
            else if (posStr === 'idiom') category = 'Thành ngữ (idiom)';
        }
        
        return {
            en: en,
            ipa: ipa,
            vi: vi,
            category: category,
            subGroup: w.subGroup
        };
    });

    // 2. Connect to Database and Backup existing AI details
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456',
        database: process.env.DB_NAME || 'server_learning_english'
    });
    
    console.log('Connected to database. Fetching existing AI definitions...');
    const [existingRows] = await connection.query(
        "SELECT en, sub_group, category, definition_en, definition_vi, example_en, example_vi FROM words WHERE master_group = '600 Từ Vựng TOEIC'"
    );
    
    // Map existing definitions for lookups
    // Key: en.toLowerCase() + '||' + sub_group.toLowerCase()
    const backupMap = new Map();
    existingRows.forEach(row => {
        if (row.definition_en) {
            const key = `${row.en.toLowerCase().trim()}||${row.sub_group ? row.sub_group.toLowerCase().trim() : ''}`;
            backupMap.set(key, {
                definition_en: row.definition_en,
                definition_vi: row.definition_vi,
                example_en: row.example_en,
                example_vi: row.example_vi
            });
        }
    });
    console.log(`Backed up ${backupMap.size} valid AI definitions from DB.`);
    
    // 3. Clear existing TOEIC words
    console.log("Deleting existing words with master_group = '600 Từ Vựng TOEIC'...");
    const [delResult] = await connection.query(
        "DELETE FROM words WHERE master_group = '600 Từ Vựng TOEIC'"
    );
    console.log(`Deleted ${delResult.affectedRows} words.`);
    
    // 4. Insert all 600 words with restored details where possible
    console.log("Inserting 600 clean parsed words into DB...");
    const crypto = require('crypto');
    let restoredCount = 0;
    let newCount = 0;
    
    for (const w of processedWords) {
        const key = `${w.en.toLowerCase().trim()}||${w.subGroup ? w.subGroup.toLowerCase().trim() : ''}`;
        const backup = backupMap.get(key);
        
        const id = crypto.randomUUID();
        const defEn = backup ? backup.definition_en : null;
        const defVi = backup ? backup.definition_vi : null;
        const exEn = backup ? backup.example_en : null;
        const exVi = backup ? backup.example_vi : null;
        
        await connection.query(
            `INSERT INTO words 
             (id, en, ipa, vi, category, master_group, sub_group, unit, definition_en, definition_vi, example_en, example_vi) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, w.en, w.ipa, w.vi, w.category, '600 Từ Vựng TOEIC', w.subGroup, null, defEn, defVi, exEn, exVi]
        );
        
        if (backup) {
            restoredCount++;
        } else {
            newCount++;
        }
    }
    
    console.log(`Successfully imported all ${processedWords.length} words!`);
    console.log(`- Restored AI details for: ${restoredCount} words.`);
    console.log(`- Needs AI details generation: ${newCount} words.`);
    
    await connection.end();
})();
