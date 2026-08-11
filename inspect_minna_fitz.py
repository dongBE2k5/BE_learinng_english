import fitz # PyMuPDF

doc = fitz.open("TỪ VỰNG 50 BÀI MINNA NO NIHONGO (2).pdf")
print("Total pages:", len(doc))

for i in range(min(5, len(doc))):
    page = doc[i]
    text = page.get_text()
    images = page.get_images()
    print(f"--- PAGE {i+1} ---")
    print(f"Text len: {len(text)}, Images count: {len(images)}")
    if text.strip():
        print("Sample text:", text[:300])
