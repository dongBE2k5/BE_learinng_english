const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'TỪ VỰNG 50 BÀI MINNA NO NIHONGO (2).pdf';

let dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log("Total Pages:", data.numpages);
    console.log("Info:", data.info);
    console.log("Text length:", data.text.length);
    console.log("\n--- FIRST 2000 CHARACTERS ---");
    console.log(data.text.slice(0, 2000));
    
    // Write sample text to file for detailed inspection
    fs.writeFileSync('minna_extracted_sample.txt', data.text.slice(0, 10000), 'utf8');
    console.log("\nSaved first 10,000 characters to minna_extracted_sample.txt");
}).catch(err => {
    console.error("PDF parse error:", err);
});
