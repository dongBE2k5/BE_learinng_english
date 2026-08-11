const fs = require('fs');
const vertexAi = require('./vertexAi');

(async () => {
    try {
        console.log('Sending minna_page_1.png to Gemini Vision OCR...');
        const imageBuffer = fs.readFileSync('minna_page_1.png');
        const base64Audio = imageBuffer.toString('base64'); // base64 payload

        const prompt = `Trích xuất tất cả từ vựng tiếng Nhật có trong trang sách này thành định dạng JSON array:
[
  {
    "lesson": 1, // Số bài (Bài 1 -> Bài 50)
    "hiragana": "わたし",
    "kanji": "私",
    "romaji": "watashi",
    "vi": "tôi",
    "category": "Danh từ"
  }
]
Chỉ trả về JSON Array thuần túy.`;

        const result = await vertexAi.processAudio(base64Audio, 'image/png', prompt, true);
        console.log("Gemini Vision OCR Output:");
        console.log(result.text);
    } catch (err) {
        console.error("OCR Error:", err);
    }
})();
