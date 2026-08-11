const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', '..', 'client', 'angel-english', 'src', 'data', 'data.json');
const dataWords = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const masterGroups = {};
dataWords.forEach(w => {
    const mg = w.master_group || 'Unspecified';
    masterGroups[mg] = (masterGroups[mg] || 0) + 1;
});

console.log('Master Groups distribution in data.json:');
console.log(masterGroups);
