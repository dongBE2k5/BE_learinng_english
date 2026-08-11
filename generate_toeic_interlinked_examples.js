const { getPool, initDB } = require('./db');
const vertexAi = require('./vertexAi');
const fs = require('fs');
const path = require('path');

const COMPLETED_FILE = path.join(__dirname, 'completed_ids.json');

async function run() {
    await initDB();
    const pool = getPool();
    
    // 1. Lấy danh sách từ vựng 13 Unit cũ (Ngân hàng từ vựng)
    const [oldWords] = await pool.query(
        "SELECT en, vi FROM words WHERE CAST(unit AS UNSIGNED) <= 13 AND unit IS NOT NULL"
    );
    console.log(`Đã tải ${oldWords.length} từ vựng từ 13 Unit cũ làm Ngân hàng từ vựng.`);
    
    // Lấy 80 từ vựng cũ ngẫu nhiên mỗi lần để tránh token quá dài
    const getRandomOldWords = (count) => {
        const shuffled = [...oldWords].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Load danh sách ID đã hoàn thành để bỏ qua
    let completedIds = [];
    if (fs.existsSync(COMPLETED_FILE)) {
        completedIds = JSON.parse(fs.readFileSync(COMPLETED_FILE, 'utf8'));
        console.log(`Đã load ${completedIds.length} từ vựng đã hoàn thành từ lần chạy trước.`);
    }

    // 2. Lấy danh sách từ vựng TOEIC cần xử lý
    let [toeicWords] = await pool.query(
        "SELECT id, en, vi, category FROM words WHERE master_group = '600 Từ Vựng TOEIC'"
    );
    
    // Lọc bỏ những từ đã làm xong
    toeicWords = toeicWords.filter(w => !completedIds.includes(w.id));
    
    console.log(`Đã tìm thấy ${toeicWords.length} từ vựng TOEIC CẦN xử lý (đã bỏ qua các từ xong rồi).`);
    
    const BATCH_SIZE = 15;
    
    for (let i = 0; i < toeicWords.length; i += BATCH_SIZE) {
        const batch = toeicWords.slice(i, i + BATCH_SIZE);
        console.log(`Đang xử lý batch ${Math.floor(i / BATCH_SIZE) + 1} của ${Math.ceil(toeicWords.length / BATCH_SIZE)}...`);
        
        const currentOldWords = getRandomOldWords(80);
        const wordsText = batch.map(w => `${w.id}: ${w.en}`).join('\n');
        const oldWordsText = currentOldWords.map(w => `${w.en} (${w.vi})`).join(', ');
        
        const prompt = `Bạn là một chuyên gia biên soạn từ vựng TOEIC.
Tôi có danh sách từ vựng TOEIC mới sau (ID: Word):
${wordsText}

Nhiệm vụ:
Viết 1 câu ví dụ tiếng Anh (example_en) và bản dịch tiếng Việt (example_vi) cho MỖI từ vựng trên.
Yêu cầu:
1. Câu ví dụ tiếng Anh phải có ngữ cảnh rõ ràng, độ khó tương đương bài thi TOEIC.
2. BẮT BUỘC chèn thêm ít nhất 1-2 từ vựng cũ vào trong câu ví dụ tiếng Anh mới này. Đây là danh sách từ cũ (hãy chọn ngẫu nhiên các từ phù hợp ngữ cảnh): ${oldWordsText}.
3. LƯU Ý TỐI QUAN TRỌNG: Bản dịch tiếng Việt (example_vi) BẮT BUỘC phải dịch sát nghĩa hoàn toàn 100% với câu ví dụ tiếng Anh (example_en) tương ứng vừa tạo. Tuyệt đối không dịch lạc đề, không râu ông nọ cắm cằm bà kia.
4. Trả về định dạng JSON thuần tuý. Để tránh nhầm lẫn, hãy thêm trường "word" chứa từ vựng đang xử lý.
Mẫu JSON: { "id1": {"word": "...", "example_en": "...", "example_vi": "..."}, ... }

Trả về kết quả DƯỚI DẠNG JSON OBJECT thuần tuý (không markdown). Format bắt buộc:
{ "id-của-từ": { "word": "...", "example_en": "...", "example_vi": "..." }, ... }`;

        let success = false;
        
        while (!success) {
            try {
                const responseText = await vertexAi.generateContent(prompt, "You are a professional TOEIC dictionary assistant.", true, false);
                
                // Clean up JSON if necessary
                let jsonText = responseText.trim();
                if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
                if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
                
                const data = JSON.parse(jsonText.trim());
                
                for (const wordId of Object.keys(data)) {
                    const info = data[wordId];
                    if (info && info.example_en) {
                        await pool.query(
                            'UPDATE words SET example_en=?, example_vi=? WHERE id=?',
                            [info.example_en, info.example_vi, wordId]
                        );
                        completedIds.push(parseInt(wordId, 10)); // Hoặc đẩy raw string ID
                    }
                }
                
                // Lưu file log
                fs.writeFileSync(COMPLETED_FILE, JSON.stringify(completedIds), 'utf8');
                
                console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} cập nhật thành công.`);
                success = true; // Thoát vòng lặp while
            } catch (err) {
                const errMsg = err.message || err.toString();
                console.error(`Lỗi ở batch ${Math.floor(i / BATCH_SIZE) + 1}:`, errMsg);
                
                // Tìm đoạn "Please retry in X.XXXs"
                const match = errMsg.match(/Please retry in ([\d\.]+)s/);
                let waitTimeMs = 5000; // Mặc định 5s
                
                if (match && match[1]) {
                    const seconds = parseFloat(match[1]);
                    waitTimeMs = (seconds + 1) * 1000; // Cộng thêm 1 giây cho an toàn
                    console.log(`=> Hệ thống yêu cầu chờ. Sẽ tự động thử lại batch này sau ${Math.ceil(waitTimeMs/1000)} giây...`);
                } else if (errMsg.includes('429 Too Many Requests') || errMsg.includes('Quota exceeded')) {
                    waitTimeMs = 60000; // Nếu báo quota chung chung thì đợi hẳn 1 phút
                    console.log(`=> Quá tải API. Sẽ tự động thử lại batch này sau 60 giây...`);
                } else {
                    console.log(`=> Lỗi khác. Thử lại sau 5 giây...`);
                }
                
                await new Promise(resolve => setTimeout(resolve, waitTimeMs));
            }
        }
    }
    
    console.log('Hoàn thành quá trình tạo câu ví dụ liên kết!');
    await pool.end();
}

run();
