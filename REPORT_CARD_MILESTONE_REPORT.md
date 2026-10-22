# Report cards and school-wide acceptance

Implemented 18 October 2026. Existing exam, enrollment, finance, assignment and portal work was inspected and preserved. No live school data was seeded, migrated, pushed or deployed.

## Completed workflows

- Admin **Report cards**: explicit published exam/version and captured class/section selection; candidate status; individual published-source preview; selection and generation; per-candidate progress/outcomes; stop after the current candidate; safe retry of failed candidates; issued PDF preview/download and retained issue history.
- Student **My Report Cards**: issued cards only, academic-year/exam filters, authenticated private PDF preview/download, latest/superseded labels and notice when a newer result publication exists.
- Remarks are explicitly entered by Admin and retained with the issue actor, timestamp, reason, source publication, previous issue and template version. The batch form clearly says its remarks apply to every selected card.
- Reissue requires a newer corrected publication and a reason. There is one immutable issued card per publication/candidate. Same-source retries return the same issued record and bytes; changing remarks/reason/template for an already-issued source is rejected rather than silently replacing the card.

The source is `ExamPublication`, never mutable working marks or today's Student placement. Every card captures the published candidate identity/class/section/roll, component states and values, applicable policy/totals/grades, school identity/logo digest, publication version and issue metadata. Transfer, correction and later school/template edits do not rewrite issued history. Optional attendance is deliberately omitted; no period counts are presented as days and no absence is inferred.

## Actual PDF generation

The renderer is `server/scripts/report-card-pdf.py`, using ReportLab 5.0.1 with an embedded TrueType font, A4 pages, repeating table headers, wrapped labels, navy/gold branding, the original Vedant Vidhya Sankul logo, protected totals, and page X of Y footers. `server/assets/vedantLogo.png` is a byte-for-byte copy of the original project asset, packaged with the server for standalone deployment.

Only text escaped by the renderer enters paragraphs. The image/font paths are administrator-controlled local assets; no input can supply HTML, images, URLs or navigation. The process blocks outgoing socket connections. This is not a headless-browser renderer. It asserts no signature, seal, rank, promotion or official certification.

Node passes bounded JSON through stdin and receives real PDF bytes on stdout. Two renderer processes may run per API process, with at most twenty queued requests, a 30-second render timeout and a 10 MB output cap. Batch requests accept at most 25 candidates and return independent success/error outcomes; the UI processes candidates sequentially for visible progress. No renderer temporary files are used. Existing private storage uses atomic `.part` writes and cleans failed temporary writes.

The default bundled Vera font supports the tested Latin text. Unsupported characters fail issuance visibly rather than silently producing missing glyphs. Configure a suitable licensed local `REPORTCARD_FONT_PATH` for other scripts and visually validate shaping before issuing those cards. This milestone does not claim Gujarati/Hindi typography acceptance.

ReportLab's local table/font facilities were checked against its [table documentation](https://docs.reportlab.com/reportlab/userguide/ch7_tables/) and [TrueType documentation](https://docs.reportlab.com/reportlab/userguide/ch3_fonts/).

## Runtime and rollout

Keep the existing Node/MongoDB setup and writable replica-set requirement. Add Python 3.10+ and install the pinned PDF requirement in a private virtual environment:

```powershell
python -m venv server/.reportcard-venv
server/.reportcard-venv/Scripts/python.exe -m pip install -r server/scripts/report-card-requirements.txt
$env:REPORTCARD_PYTHON=(Resolve-Path server/.reportcard-venv/Scripts/python.exe).Path
```

On Linux use `python3 -m venv server/.reportcard-venv`, then its `bin/python -m pip install -r ...`, and set `REPORTCARD_PYTHON` to that absolute interpreter path. If the variable is absent, the application finds the local `.reportcard-venv` interpreter when present, then falls back to `python`. Do not commit the environment. Include `server/scripts/report-card-pdf.py`, its requirements and `server/assets/vedantLogo.png` in the server deployment.

`REPORTCARD_FONT_PATH` is optional and must identify a local TrueType font. `RESOURCE_STORAGE_DIR` and `RESOURCE_MAX_MB` retain their existing meanings. The latter also limits stored generated PDFs. No new public storage mount is introduced. QA additionally uses PyMuPDF 1.28.2; it is not a production renderer dependency.

New collection: **ReportCard**. Required indexes are unique `(publication, candidate)`, unique `(exam, candidate, issueNumber)`, owner/year/exam lookup, and file-key lookup. Provision these indexes before concurrent issuance in an existing deployment. There is no destructive migration or historical backfill. Issuance commits contend on the existing exam lock, serialize against publication operations, and check the latest issue before committing; duplicate rendering attempts discard only their own unreferenced artifacts.

## Privacy, retention and backup

Every PDF request passes existing role, onboarding, token-version, active-account/profile and owning-Student checks. Teacher access is denied. Responses use `application/pdf`, private/no-store caching and an authenticated attachment/inline route. The frontend uses short-lived local blob URLs and revokes them on close. Storage keys are not exposed in API list responses.

Issued PDFs are cached immutable artifacts. Downloads verify their stored size and SHA-256. Missing/corrupt files produce an explicit restore error; the application does not regenerate different bytes under an old document ID. Existing cleanup now treats every ReportCard reference, including superseded issues, as retained. Unreferenced files remain subject to the existing 24-hour cleanup grace period and final reference recheck.

Back up the database and the matching `RESOURCE_STORAGE_DIR` together, retaining all historical report-card files. Restore both into an isolated environment and verify file hashes and authenticated downloads before a production restoration. A database-only backup cannot recover issued PDF bytes. No artifact-retention purge or automatic deletion of old cards is introduced.

## Verification and acceptance

- Full isolated school regression suite: **890 HTTP/integration checks passed** across people/onboarding, enrollment, timetable/attendance, resources, notices/calendar, finance/salaries, assignments, exams and report cards.
- Focused exam/report-card suite: **139 HTTP checks passed**, plus transaction/concurrency, retry, snapshot/history, file integrity, cleanup and A4-content assertions.
- Demo suite: **4 tests passed**, including all five issued cards, corrected history, transferred ownership, 36-component publication, multi-page rendering and rerun/manual-edit preservation.
- Frontend: **32 tests**, lint and production build passed. The existing bundle-size advisory remains.
- Backend: **12 core/calculation tests** and **262 import/case checks** passed.
- `git diff --check` passed. Logs are in `.verification/report-cards-*.log`.
- Visually inspected the one-page synthetic card and **all four pages** of the long-name/36-component card. Original-logo branding, wrapping, repeated headers, policy/remarks blocks, totals, margins and page numbering are readable with no observed overlaps or clipped text. Automated bounds checks found zero outside-page text spans.

Two synthetic PDF samples are retained in `output/pdf/report-card-synthetic-single-page.pdf` and `output/pdf/report-card-synthetic-multi-page.pdf`. The single-page sample deliberately includes a formula-like Student name as an escaping/security fixture; it is not real Student data. Browser inventory returned no enabled browser, so **desktop/mobile browser acceptance is pending**; source/API tests are not represented as browser evidence.

Use [REPORT_CARD_DEMO_REPORT.md](REPORT_CARD_DEMO_REPORT.md) for reproducible synthetic scenarios and [SCHOOL_ACCEPTANCE_CHECKLIST.md](SCHOOL_ACCEPTANCE_CHECKLIST.md) for manual portal checks.

Remaining operational limits: single-process bounded rendering is not a distributed job queue; list/history screens load their authorized records without large-school pagination; non-Latin shaping needs font-specific acceptance; the existing frontend bundle-size advisory remains. Optional attendance and same-publication administrative document amendments are not included. A reissue in this milestone requires a corrected result publication.

Next milestone: **deployment readiness, backup restoration, monitoring and a controlled school pilot**.

## Follow-up verification — 18 October 2026

The local operational follow-up is documented in [OPERATIONS_READINESS.md](OPERATIONS_READINESS.md). The full suite now passes **909 HTTP checks**, including recovery of 32 collections/302 records and 13 private files into separate synthetic targets, original/corrected report-card hash checks and authenticated download restrictions. A read-only readiness CLI, monitoring requirements, paired database/file backup procedure and controlled pilot gates are available. Browser acceptance, official MongoDB backup-tool restoration and target-infrastructure/pilot sign-off remain pending; no deployment or live-data work was performed.
