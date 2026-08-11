import fitz

doc = fitz.open("TỪ VỰNG 50 BÀI MINNA NO NIHONGO (2).pdf")

# Render first 5 pages to PNG for testing
for page_num in range(min(5, len(doc))):
    page = doc[page_num]
    pix = page.get_pixmap(dpi=150)
    pix.save(f"minna_page_{page_num+1}.png")
    print(f"Saved minna_page_{page_num+1}.png")
