const fs = require('fs');
const content = fs.readFileSync('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'utf8');

let daysText = content.split('day: ');
let output = "# Thống kê Lộ trình 30 Ngày TOEIC và Các chủ đề từ vựng\n\n";
output += "Tài liệu này thống kê chi tiết các chủ đề và nhóm từ vựng (tương ứng với bộ 600 Từ vựng TOEIC Cốt lõi) được lấy cho từng ngày trong ứng dụng.\n\n";

for (let i = 1; i < daysText.length; i++) {
    const block = daysText[i];
    const dayMatch = block.match(/^(\d+),/);
    
    // Some titles have quotes, some don't, we'll try to match whatever is inside title: "..."
    const titleMatch = block.match(/title:\s*"([^"]+)"/);
    const topicMatch = block.match(/vocabTopic:\s*"([^"]+)"/);
    
    // Extact vocabSubGroups arrays
    const subGroupsMatch = block.match(/vocabSubGroups:\s*\[(.*?)\]/);
    
    let subGroups = [];
    if (subGroupsMatch) {
        subGroups = subGroupsMatch[1].split('",').map(s => s.replace(/"/g, '').trim()).filter(s => s.length > 0);
    }

    if (dayMatch && titleMatch) {
        output += "## Ngày " + dayMatch[1] + ": " + titleMatch[1] + "\n";
        output += "- **Chủ đề chính:** " + (topicMatch ? topicMatch[1] : 'Không có') + "\n";
        output += "- **Nhóm từ vựng ghép từ 600 TOEIC:** \n";
        if (subGroups.length > 0) {
            subGroups.forEach(sg => {
                output += "  - " + sg + "\n";
            });
        } else {
            output += "  - (Chỉ dùng từ vựng tĩnh cố định)\n";
        }
        output += '\n';
    }
}

fs.writeFileSync('C:/Users/LAPTOP/.gemini/antigravity/brain/ef848fec-a6b5-4fc1-b79a-a35c3b73742c/toeic_30_days_stats.md', output, 'utf8');
console.log('Stats extracted successfully to artifact folder!');
