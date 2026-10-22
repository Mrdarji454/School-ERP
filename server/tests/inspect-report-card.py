import json, sys
from pathlib import Path
import pymupdf as fitz
source=Path(sys.argv[1]); target=Path(sys.argv[2]); target.mkdir(parents=True, exist_ok=True)
doc=fitz.open(source); outside=0
for n,page in enumerate(doc):
    page.get_pixmap(matrix=fitz.Matrix(1.25,1.25)).save(target / f'{source.stem}-page-{n+1}.png')
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox']
                if x0<20 or y0<10 or x1>page.rect.width-20 or y1>page.rect.height-10: outside+=1
print(json.dumps({'pages':len(doc),'text':'\n'.join(p.get_text() for p in doc),'images':sum(len(p.get_images()) for p in doc),'outside':outside,'a4':all(abs(p.rect.width-595.28)<1 and abs(p.rect.height-841.89)<1 for p in doc)}))
