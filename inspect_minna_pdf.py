import pypdf
import sys

pdf_path = "TỪ VỰNG 50 BÀI MINNA NO NIHONGO (2).pdf"

try:
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    text_sample = ""
    for i in range(min(5, len(reader.pages))):
        page_text = reader.pages[i].extract_text()
        print(f"--- PAGE {i+1} ---")
        print(page_text[:500])
except Exception as e:
    print(f"pypdf error: {e}")
    # try pdfplumber if available
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            print(f"pdfplumber total pages: {len(pdf.pages)}")
            for i in range(min(3, len(pdf.pages))):
                print(f"--- PLUMBER PAGE {i+1} ---")
                print(pdf.pages[i].extract_text()[:500])
    except Exception as e2:
        print(f"pdfplumber error: {e2}")
