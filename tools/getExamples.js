const fs = require('fs');
const dataContent = fs.readFileSync('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'utf8');
let lines = dataContent.split('\n');
let examples = [];
for (let i = 0; i < lines.length; i++) {
    let match = lines[i].match(/example:\s*"([^"]+)"/);
    if (match && !lines[i].includes('exampleVi:')) {
        examples.push({ index: i, text: match[1] });
    }
}
fs.writeFileSync('examplesToTranslate.json', JSON.stringify(examples, null, 2));
console.log('Saved to examplesToTranslate.json');
