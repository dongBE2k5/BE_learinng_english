import fitz
import os

pdf_path = 'TỪ VỰNG 50 BÀI MINNA NO NIHONGO (2).pdf'
out_dir = 'minna_pages'

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

doc = fitz.open(pdf_path)
print(f"Total pages to render: {len(doc)}")

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    img_path = os.path.join(out_dir, f"page_{i+1}.png")
    pix.save(img_path)
    if (i+1) % 10 == 0 or (i+1) == len(doc):
        print(f"Rendered {i+1}/{len(doc)} pages...")

print(f"Done rendering all {len(doc)} pages to {out_dir}/")
