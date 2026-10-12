"""Original, fictional demonstration documents. Requires reportlab; fitz renders QA PNGs."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
import fitz

root = Path(__file__).resolve().parents[3]
output = root / 'output' / 'pdf'
preview = root / '.verification' / 'learning-pdfs'
output.mkdir(parents=True, exist_ok=True)
preview.mkdir(parents=True, exist_ok=True)
documents = [
    ('demo-english-paper.pdf', 'English practice paper', 'CLASS 6  /  MOCK TEST', [
        ('Instructions', ['Time: 20 minutes. Write your answers on your own paper.', 'This original fictional practice sheet is for ERP testing only.']),
        ('1. Read and understand', ['Mira planted a seed beside her window. Each morning she checked', 'the soil and added a little water. A green shoot appeared after a week.', 'Why did Mira check the soil every morning? Answer in one sentence.']),
        ('2. Complete the sentence', ['Choose the correct word: The two birds (is / are) on the branch.']),
        ('3. Find the describing word', ['In "a bright yellow kite", write the two words that describe the kite.']),
        ('4. Write a short paragraph', ['Write four sentences about a helpful habit. Include one example.']),
    ]),
    ('demo-english-answer-key.pdf', 'English answer key', 'CLASS 6  /  ANSWER KEY', [
        ('Publication control', ['This answer key is a separate resource. Publishing the question', 'paper does not publish this document.']),
        ('1. Reading response', ['Example: Mira checked whether the seed had enough water to grow.', 'Accept another clear response supported by the passage.']),
        ('2. Subject and verb', ['Correct word: are. The subject refers to two birds.']),
        ('3. Describing words', ['The describing words are bright and yellow.']),
        ('4. Short paragraph', ['Look for four connected sentences and a clear example.', 'This sheet offers guidance only; the ERP does not grade responses.']),
    ]),
    ('demo-fractions-study-notes.pdf', 'Fractions: a short guide', 'CLASS 7  /  STUDY MATERIAL', [
        ('Equal parts', ['A fraction describes equal parts of a whole. In 3/4, the denominator', '4 counts all equal parts; the numerator 3 counts the parts selected.']),
        ('Equivalent fractions', ['Multiplying both numbers by the same nonzero number preserves', 'the value. For example: 1/2 = 2/4 = 3/6.']),
        ('Adding like denominators', ['Add the numerators and keep the common denominator.', 'Example: 2/7 + 3/7 = 5/7.']),
        ('Try it yourself', ['A. Write an equivalent fraction for 2/3 using denominator 12.', 'B. Add 1/8 and 5/8. Simplify the answer.', 'C. Explain why the parts must be equal.']),
        ('Check your work', ['A. 8/12.  B. 6/8 = 3/4.', 'C. Equal parts make the size of each fractional unit consistent.']),
    ]),
]
for filename, title, subtitle, sections in documents:
    target = output / filename
    pdf = canvas.Canvas(str(target), pagesize=A4, invariant=1)
    width, height = A4
    pdf.setTitle(title); pdf.setAuthor('Demo Vidya School - original synthetic content')
    pdf.setFillColor(HexColor('#13243a')); pdf.rect(0, height - 160, width, 160, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#a8d8ff')); pdf.setFont('Helvetica-Bold', 10); pdf.drawString(48, height - 47, 'DEMO VIDYA SCHOOL')
    pdf.setFillColor(HexColor('#ffffff')); pdf.setFont('Helvetica-Bold', 25); pdf.drawString(48, height - 91, title)
    pdf.setFont('Helvetica', 10); pdf.drawString(48, height - 119, subtitle)
    y = height - 199
    for heading, lines in sections:
        pdf.setFillColor(HexColor('#185b98')); pdf.setFont('Helvetica-Bold', 12); pdf.drawString(48, y, heading); y -= 24
        pdf.setFillColor(HexColor('#263547')); pdf.setFont('Helvetica', 11)
        for line in lines:
            pdf.drawString(48, y, line); y -= 17
        y -= 21
    assert y > 55, 'Page content overlaps footer'
    pdf.setStrokeColor(HexColor('#d7dfe8')); pdf.line(48, 55, width - 48, 55)
    pdf.setFillColor(HexColor('#65748a')); pdf.setFont('Helvetica', 9)
    pdf.drawString(48, 35, 'Original fictional content. No real student information.'); pdf.drawRightString(width - 48, 35, '1 / 1')
    pdf.save()
    doc = fitz.open(target)
    assert len(doc) == 1 and title in doc[0].get_text()
    doc[0].get_pixmap(matrix=fitz.Matrix(1.3, 1.3)).save(preview / filename.replace('.pdf', '.png'))
    doc.close()
    print(filename + ': created, extracted and rendered')
