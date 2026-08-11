import pdfplumber
with pdfplumber.open("toeic-ets-2026-vocabulary.pdf") as pdf:
    text = pdf.pages[0].extract_text()
    with open("plumber_page_1.txt", "w", encoding="utf-8") as f:
        f.write(text)
