const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'minna_50_lessons.json');
if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Extracted count in minna_50_lessons.json: ${data.length}`);

    const lessonsCount = {};
    data.forEach(w => {
        const l = w.sub_group || `Bài ${w.lesson}`;
        lessonsCount[l] = (lessonsCount[l] || 0) + 1;
    });
    console.log("Lessons breakdown:", Object.keys(lessonsCount).length, "Lessons found.");
    console.log(lessonsCount);
} else {
    console.log("minna_50_lessons.json does not exist yet.");
}
