const fs = require('fs');
const content = fs.readFileSync('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'utf8');
const match = content.match(/export const toeic30DaysData = \[([\s\S]*)\];/);
if (match) {
    let items = match[1].split('},').filter(i => i.trim() !== '');
    console.log(items.length);
}
