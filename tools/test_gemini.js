const vertexAi = require('./vertexAi');

async function run() {
    try {
        console.log("Using API Key from process.env.GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);
        const text = await vertexAi.generateContent('Translate to Vietnamese: "The meeting is scheduled for Monday."');
        console.log("Success! Translated text:", text);
    } catch (err) {
        console.error("AI Generation failed with error:", err);
    }
}
run();
