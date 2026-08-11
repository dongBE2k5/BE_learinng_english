const fs = require('fs');
const path = require('path');
const vertexAi = require('./vertexAi');

(async () => {
    try {
        console.log('Starting full OCR extraction of 50 Lessons Minna No Nihongo from minna_pages/...');

        const minnaPagesDir = path.join(__dirname, 'minna_pages');
        const pageFiles = fs.readdirSync(minnaPagesDir)
                            .filter(f => f.endsWith('.png'))
                            .sort((a, b) => parseInt(a.replace(/[^\d]/g, '')) - parseInt(b.replace(/[^\d]/g, '')));

        console.log(`Found ${pageFiles.length} page images in minna_pages/`);

        let allExtractedWords = [];
        const outputFile = path.join(__dirname, 'minna_50_lessons.json');
        if (fs.existsSync(outputFile)) {
            try {
                allExtractedWords = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
                console.log(`Loaded ${allExtractedWords.length} previously extracted words.`);
            } catch (e) {}
        }

        const processedPagesFile = path.join(__dirname, 'minna_processed_pages.json');
        let processedPages = new Set();
        if (fs.existsSync(processedPagesFile)) {
            try {
                processedPages = new Set(JSON.parse(fs.readFileSync(processedPagesFile, 'utf8')));
            } catch (e) {}
        }

        let currentLesson = 1;

        for (let idx = 0; idx < pageFiles.length; idx++) {
            const p = idx + 1;
            const fileName = pageFiles[idx];

            if (processedPages.has(p)) {
                console.log(`Skipping page ${p}/${pageFiles.length} (already processed)`);
                continue;
            }

            console.log(`Processing page ${p}/${pageFiles.length} (${fileName}) with Gemini Vision OCR...`);
            const pagePath = path.join(minnaPagesDir, fileName);
            const imageBuffer = fs.readFileSync(pagePath);
            const base64Data = imageBuffer.toString('base64');

            const prompt = `Trích xuất tất cả từ vựng tiếng Nhật có trong trang sách này thành định dạng JSON array:
[
  {
    "lesson": 1, // Số bài (1 -> 50). Xác định dựa vào tiêu đề "Bài 1", "Bài 2",... trên trang. Nếu trang không ghi tiêu đề, mặc định dùng số bài gần nhất (hiện tại là Bài ${currentLesson})
    "hiragana": "わたし",
    "kanji": "私",
    "romaji": "watashi",
    "vi": "tôi",
    "category": "Danh từ" // Danh từ, Động từ, Tính từ (i), Tính từ (na), Phó từ, Thán từ, Cụm từ...
  }
]
Chú ý:
- Nếu từ không có Kanji, gán kanji là null.
- "hiragana" là cách đọc Kana chuẩn.
- "romaji" là phiên âm Romaji (ví dụ: watashi, anata, sensei, ikimasu...).
- "vi" là nghĩa tiếng Việt chính xác.
- Chỉ trả về JSON Array thuần túy.`;

            try {
                const result = await vertexAi.processAudio(base64Data, 'image/png', prompt, true);
                let jsonText = result.text.trim();
                if (jsonText.startsWith('```json')) jsonText = jsonText.slice(7);
                if (jsonText.endsWith('```')) jsonText = jsonText.slice(0, -3);

                const pageWords = JSON.parse(jsonText.trim());
                if (Array.isArray(pageWords) && pageWords.length > 0) {
                    console.log(`Page ${p}: extracted ${pageWords.length} words.`);
                    pageWords.forEach((w, wIdx) => {
                        const lNum = w.lesson || currentLesson;
                        if (w.lesson && w.lesson >= 1 && w.lesson <= 50) {
                            currentLesson = w.lesson;
                        }
                        allExtractedWords.push({
                            id: `minna-l${lNum}-${wIdx+1}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                            lesson: lNum,
                            hiragana: w.hiragana || '',
                            kanji: w.kanji || null,
                            romaji: w.romaji || '',
                            vi: w.vi || '',
                            category: w.category || 'Từ vựng',
                            master_group: 'Từ Vựng Tiếng Nhật Minna No Nihongo',
                            sub_group: `Bài ${String(lNum).padStart(2, '0')}`
                        });
                    });
                }

                processedPages.add(p);
                fs.writeFileSync(outputFile, JSON.stringify(allExtractedWords, null, 2), 'utf8');
                fs.writeFileSync(processedPagesFile, JSON.stringify(Array.from(processedPages)), 'utf8');
            } catch (err) {
                console.error(`Page ${p} OCR Error:`, err.message);
            }
        }

        console.log(`Extraction complete! Total Japanese words: ${allExtractedWords.length}`);
    } catch (err) {
        console.error('Fatal extraction error:', err);
    }
})();
