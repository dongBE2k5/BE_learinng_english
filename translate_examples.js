const { getPool, initDB } = require('./db');
const vertexAi = require('./vertexAi');

async function run() {
    await initDB();
    const pool = getPool();
    
    // Find all words with example_en but no example_vi
    const [words] = await pool.query(
        "SELECT id, en, example_en FROM words WHERE example_en IS NOT NULL AND example_en != '' AND (example_vi IS NULL OR example_vi = '')"
    );
    console.log(`Found ${words.length} words needing example translation.`);
    
    const BATCH_SIZE = 20;
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(words.length / BATCH_SIZE)}...`);
        
        const lines = batch.map(w => `${w.id} | Word: ${w.en} | Example: ${w.example_en}`).join('\n');
        
        const prompt = `Translate the following English example sentences into Vietnamese. Ensure the translation matches the specific word's context.
Return ONLY a pure JSON object mapping the ID to the translated Vietnamese sentence. DO NOT include markdown, just pure JSON.
Output format:
{ "id1": "Vietnamese translation 1", "id2": "Vietnamese translation 2" }

Sentences to translate:
${lines}`;

        let success = false;
        while (!success) {
            try {
                const responseText = await vertexAi.generateContent(prompt, "You are a professional translator.", true, false);
                let jsonText = responseText.trim();
                if (jsonText.startsWith('```json')) jsonText = jsonText.substring(7);
                if (jsonText.startsWith('```')) jsonText = jsonText.substring(3);
                if (jsonText.endsWith('```')) jsonText = jsonText.substring(0, jsonText.length - 3);
                
                const data = JSON.parse(jsonText.trim());
                
                for (const wordId of Object.keys(data)) {
                    if (data[wordId]) {
                        await pool.query(
                            'UPDATE words SET example_vi=? WHERE id=?',
                            [data[wordId], wordId]
                        );
                    }
                }
                console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} updated.`);
                success = true;
            } catch (err) {
                console.error(`Error in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message);
                const match = err.message.match(/Please retry in ([\d\.]+)s/);
                let waitTimeMs = 5000;
                if (match && match[1]) {
                    waitTimeMs = (parseFloat(match[1]) + 1) * 1000;
                } else if (err.message.includes('429') || err.message.includes('Quota')) {
                    waitTimeMs = 30000;
                }
                console.log(`Waiting ${waitTimeMs}ms...`);
                await new Promise(r => setTimeout(r, waitTimeMs));
            }
        }
    }
    console.log('Finished translating examples!');
    await pool.end();
}
run();
