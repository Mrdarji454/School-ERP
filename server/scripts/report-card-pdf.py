"""Local-only A4 report-card renderer: JSON stdin, real PDF stdout, no temporary files."""
import io
import json
import os
from pathlib import Path
import socket
import sys
from hashlib import sha256
from xml.sax.saxutils import escape
import reportlab
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, LongTable, TableStyle, KeepTogether


def deny_network(*args, **kwargs):
    raise RuntimeError('Network access is disabled in PDF rendering')


socket.create_connection = deny_network
socket.socket.connect = deny_network
socket.socket.connect_ex = deny_network
ROOT = Path(__file__).resolve().parents[2]
LOGO = ROOT / 'server/assets/vedantLogo.png'
FONT = Path(os.environ.get('REPORTCARD_FONT_PATH') or Path(reportlab.__file__).parent / 'fonts/Vera.ttf')
pdfmetrics.registerFont(TTFont('ReportBody', str(FONT)))
font = pdfmetrics.getFont('ReportBody')
NAVY, GOLD = colors.HexColor('#15283f'), colors.HexColor('#a37b2d')
PALE, LINE = colors.HexColor('#f3f5f8'), colors.HexColor('#d6dce3')
body = ParagraphStyle('Body', fontName='ReportBody', fontSize=9, leading=13, textColor=NAVY, spaceAfter=5, splitLongWords=True)
small = ParagraphStyle('Small', parent=body, fontSize=8, leading=11)
heading = ParagraphStyle('Heading', parent=body, fontSize=17, leading=22, spaceAfter=9)
white = ParagraphStyle('White', parent=small, textColor=colors.white)


def text(value):
    value = str('' if value is None else value)
    value = ''.join(c for c in value if ord(c) >= 32 or c in '\n\t').replace('\t', ' ')
    if any(ord(c) not in font.face.charToGlyph for c in value if c != '\n'):
        raise ValueError('Unsupported text: configure REPORTCARD_FONT_PATH with matching glyph coverage')
    return escape(value).replace('\n', '<br/>')


def p(value, style=body):
    return Paragraph(text(value), style)


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.states = []

    def showPage(self):
        self.states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        count = len(self.states)
        for state in self.states:
            self.__dict__.update(state)
            self.setStrokeColor(LINE)
            self.line(40, 46, A4[0] - 40, 46)
            self.setFont('ReportBody', 7)
            self.setFillColor(NAVY)
            self.drawString(40, 33, 'Document ' + snapshot['documentId'] + ' / Issue ' + str(snapshot['issueNumber']))
            self.drawRightString(A4[0] - 40, 33, f'Page {self._pageNumber} of {count}')
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)


def header(c, doc):
    c.saveState()
    c.drawImage(str(LOGO), 40, A4[1] - 88, width=64, height=64, preserveAspectRatio=True, anchor='c', mask='auto')
    c.setFillColor(NAVY)
    c.setFont('ReportBody', 17)
    c.drawString(118, A4[1] - 49, snapshot['school']['name'])
    c.setFont('ReportBody', 9)
    c.drawString(118, A4[1] - 67, 'Academic report card / Published examination results')
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(40, A4[1] - 96, A4[0] - 40, A4[1] - 96)
    c.restoreState()


snapshot = json.loads(sys.stdin.buffer.read(2 * 1024 * 1024))
if sha256(LOGO.read_bytes()).hexdigest() != snapshot['school']['logoSha256']:
    raise ValueError('School logo changed during generation')
r, policy = snapshot['result'], snapshot['policy']
output = io.BytesIO()
doc = SimpleDocTemplate(output, pagesize=A4, topMargin=111, bottomMargin=63, leftMargin=40, rightMargin=40, title='Report card - ' + str(snapshot['examName']), author=snapshot['school']['name'])
story = [p(snapshot['examName'], heading), p('Academic year: ' + snapshot['academicYearName']), p(r['name'], heading)]
identity = [[p('Admission ID: ' + str(r.get('admissionNo') or 'Not recorded')), p('Roll: ' + str(r.get('rollNumber') if r.get('rollNumber') is not None else 'Not recorded'))], [p('Class: ' + r['className']), p('Section: ' + r['sectionName'])]]
table = LongTable(identity, colWidths=[257, 258], style=TableStyle([('BACKGROUND', (0, 0), (-1, -1), PALE), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 10), ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
story.extend([table, Spacer(1, 12), p(f"Published result version {snapshot['sourceVersion']} / Issued {snapshot['issueDate']} ({snapshot['timeZone']})", small), Spacer(1, 5)])
rows = [[p(label, white) for label in ['Subject / component', 'Entry state', 'Score', 'Maximum', 'Configured threshold']]]
for m in r['marks']:
    component = next((c for c in snapshot['components'] if str(c['_id']) == str(m['component'])), {})
    threshold = 'Not configured' if m.get('passMarks') is None else f"{m['passMarks']} / " + ('Not assessed' if m.get('meetsComponentPassMark') is None else 'Met' if m['meetsComponentPassMark'] else 'Not met')
    label = str(component.get('subjectName') or '') + ' / ' + m['name']
    if not m.get('contributes'):
        label += ' (excluded from total)'
    rows.append([p(label, small), p(m['state'], small), p(m['score'] if m.get('score') is not None else '-', small), p(m['maximum'], small), p(threshold, small)])
marks = LongTable(rows, colWidths=[205, 66, 47, 57, 140], repeatRows=1, hAlign='LEFT', splitByRow=1, splitInRow=1)
marks.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), NAVY), ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, PALE]), ('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, 0), 1, GOLD), ('LINEBELOW', (0, 1), (-1, -1), .4, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
story.extend([marks, Spacer(1, 15)])
totals = [p('Published summary', heading)]
if r.get('total') is not None:
    totals.append(p(f"Total {r['total']} / {r['maximum']} | Percentage {r['percentage']}%"))
else:
    totals.append(p(r.get('totalNote') or 'No supported total'))
if r.get('grade'):
    totals.append(p('Grade: ' + r['grade']))
if r.get('meetsOverallPassThreshold') is not None:
    totals.append(p('Overall configured threshold: ' + ('Met' if r['meetsOverallPassThreshold'] else 'Not met')))
story.append(KeepTogether(totals))
story.append(p(f"Policy v{policy['version']}: aggregation {policy['aggregation']}; half-up rounding to {policy['decimals']} decimal places. Absent: {policy['absent']}; exempt: {policy['exempt']}. Grade boundaries use rounded percentage. Component and overall thresholds are independent. Missing marks are never converted to zero.", small))
if policy.get('grades'):
    story.append(p('Configured grades: ' + '; '.join(f"{g['label']} >= {g['minimum']}%" for g in policy['grades']), small))
if policy.get('passPercent') is not None:
    story.append(p('Overall threshold: ' + str(policy['passPercent']) + '%', small))
if snapshot.get('remarks'):
    story.extend([Spacer(1, 9), p('Authorized remarks', heading), p(snapshot['remarks'])])
if snapshot.get('reason'):
    story.append(p('Issue / reissue reason: ' + snapshot['reason'], small))
story.extend([Spacer(1, 9), p('Issued by: ' + str(snapshot.get('actorName') or 'Authorized Admin') + ' / Template ' + snapshot['templateVersion'], small), p('Retained published-result record. No signature, seal, rank or promotion decision is asserted. Class and roll are taken from the exam candidate snapshot.', small)])
doc.build(story, onFirstPage=header, onLaterPages=header, canvasmaker=NumberedCanvas)
sys.stdout.buffer.write(output.getvalue())
