const fs = require('fs');

async function main() {
    const dataContent = fs.readFileSync('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', 'utf8');
    
    let newContent = dataContent;
    let lines = dataContent.split('\n');
    let examplesToTranslate = [];
    
    for (let i = 0; i < lines.length; i++) {
        let match = lines[i].match(/example:\s*"([^"]+)"/);
        if (match && !lines[i].includes('exampleVi:')) {
            examplesToTranslate.push({ index: i, text: match[1] });
        }
    }
    
    console.log(`Found ${examplesToTranslate.length} examples to translate.`);
    if (examplesToTranslate.length === 0) return;
    
    const batchSize = 50;
    for (let i = 0; i < examplesToTranslate.length; i += batchSize) {
        const batch = examplesToTranslate.slice(i, i + batchSize);
        console.log(`Translating batch ${Math.floor(i/batchSize) + 1}...`);
        
        const prompt = "Translate the following English sentences to Vietnamese. Respond ONLY with a valid JSON array of strings containing the translations, nothing else: " + JSON.stringify(batch.map(b => b.text));
        
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: prompt }]
            })
        });
        
        const json = await res.json();
        try {
            const raw = json.choices[0].message.content;
            const match = raw.match(/\[([\s\S]*?)\]/);
            const translations = JSON.parse(match[0]);
            
            for (let j = 0; j < batch.length; j++) {
                const lineIndex = batch[j].index;
                lines[lineIndex] = lines[lineIndex].replace(/example:\s*"([^"]+)"/, `example: "$1", exampleVi: "${translations[j].replace(/"/g, '\\"')}"`);
            }
        } catch (e) {
            console.log("Error parsing JSON array from response", e);
            console.log("Raw output:", json.choices?.[0]?.message?.content);
            return;
        }
    }
    
    fs.writeFileSync('J:/Leaning English Website/client/angel-english/src/data/toeic30DaysData.js', lines.join('\n'));
    console.log("Translation complete!");
}
main();
