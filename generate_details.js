const { getPool, initDB } = require('./db');
const vertexAi = require('./vertexAi');

async function run() {
    await initDB();
    const pool = getPool();
    const [words] = await pool.query("SELECT * FROM words WHERE master_group = '600 Từ Vựng TOEIC' AND definition_en IS NULL");
    console.log(`Found ${words.length} words to process.`);
    
    // Process in batches of 20
    const BATCH_SIZE = 20;
    for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(words.length / BATCH_SIZE)}...`);
        
        const prompt = `For the following list of English words (with their Vietnamese meanings and category), generate dictionary details for TOEIC learners.
        Generate:
        - definition_en: A concise English definition (similar to Oxford/Cambridge).
        - definition_vi: A natural Vietnamese translation of the definition.
        - example_en: A practical TOEIC-style English example sentence using the word.
        - example_vi: A natural Vietnamese translation of the example sentence.

        Return strictly a JSON object where keys are the exact word IDs provided.
        Format: { "word-id-1": { "definition_en": "...", "definition_vi": "...", "example_en": "...", "example_vi": "..." }, ... }
        
        Words to process:
        ${batch.map(w => `ID: ${w.id} | Word: ${w.en} | Type: ${w.category} | Meaning: ${w.vi}`).join('\n')}`;
        
        try {
            const responseText = await vertexAi.generateContent(prompt, "You are a professional TOEIC dictionary assistant.", true, false);
            
            // Clean up JSON if necessary
            let jsonText = responseText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.substring(7);
            }
            if (jsonText.endsWith('```')) {
                jsonText = jsonText.substring(0, jsonText.length - 3);
            }
            
            const data = JSON.parse(jsonText.trim());
            
            for (const wordId of Object.keys(data)) {
                const info = data[wordId];
                if (info && info.definition_en) {
                    await pool.query(
                        'UPDATE words SET definition_en=?, definition_vi=?, example_en=?, example_vi=? WHERE id=?',
                        [info.definition_en, info.definition_vi, info.example_en, info.example_vi, wordId]
                    );
                }
            }
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} updated successfully.`);
        } catch (err) {
            console.error(`Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message || err);
            // Wait 5 seconds before next batch if error
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    console.log('Finished processing all words.');
    process.exit(0);
}

run();
