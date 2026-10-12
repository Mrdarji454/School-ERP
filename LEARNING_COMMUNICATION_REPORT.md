# Learning resources, notices and academic calendar

Implemented on 10 October 2026, continuing the expanded Student/Teacher milestone. Existing profile, onboarding, import/export, timetable, attendance and finance workflows are retained. No deployment, push, destructive migration or live-school database changes were performed.

## Completed workflows

- **Admin:** Learning resources with year/class/section/subject/type/uploader/state filters, search, pagination, school-authorized PDF uploads, metadata editing, publication scheduling, archive reasons, file inspection/download and actor-labelled publication history. Notices support audiences, scheduling, expiry, edit/detail, deactivate/restore. Academic calendar provides a searchable date-range list and event forms for Holiday, Working Day, Half Day, Vacation, Event and Exam.
- **Teacher:** My resources supports PDF uploads to one subject/class and one or more eligible sections, drafts, scheduled publication, metadata edits, archival, preview and download. Only the uploader can manage the resource, and every targeted section must remain covered by an eligible assignment. Assignment deactivation revokes management access; Admin retains oversight.
- **Student:** Resource library shows eligible published PDFs with type/subject filters, safe uploader names, publication times, details, previews and downloads. Answer keys are independent resources with independent release controls.
- **All roles:** Relevant notices and calendar pages, protected navigation, dashboard links and API-backed counts. Shared forms retain failed submissions, prevent duplicate submission, show upload/processing progress, reset dependent choices and cancel stale list requests. Responsive layouts and existing accessible modal/form components are reused.

## Eligibility and publication rules

Student access uses the authenticated, active Student profile's **current class and section**, with active academic relationships and subject. Historical enrollment is not inferred. Moving placement changes resource, selected-notice and calendar eligibility immediately. Client-supplied class/student IDs cannot widen access. Both metadata and file endpoints enforce eligibility. Draft, future, expired, archived and other-class resources are hidden from Students; private keys, checksums and staff audit fields are never returned to them.

Teachers can preview their own eligible drafts/future publications, but ordinary users cannot retrieve expired or archived files. Admin may inspect these retained files. Draft and published resources may be edited; archival requires a reason. Only Admin may restore archived resources, first to draft before publication. Optimistic versions reject stale resource and new communication form saves.

**Files are immutable.** A correction is a new upload/resource followed by archival of the obsolete resource. There is no silent file replacement or fabricated replacement history. Publication/state changes retain actor, time and reason; metadata edits are recorded as audit events, not a full historical snapshot of every field.

Notices use a union of the selected targets: selecting a whole class includes every section in that class; selecting individual sections includes those sections. Teachers qualify through eligible assignments; Students through actual placement. Everyone/Teachers/Students refer to authenticated roles. Admin has management oversight of every audience, while dashboard/active notice feeds only show currently published notices. Missing legacy audience means Everyone. Future, expired, inactive and ineligible notices are excluded from role dashboards, workflow reads, new communication APIs and legacy notification reads/details.

Calendar events are date-only values scoped to the Student's current academic year or the Teacher's eligible assignment years. Admin may manage all years. Calendar changes **do not** cancel timetable bookings, create absences or change attendance calculations. Publication timestamps are displayed/edited in `SCHOOL_TIMEZONE` (default Asia/Kolkata). Calendar dates retain their literal school date. Legacy date-only notice API inputs retain their previous UTC-midnight interpretation; the new UI sends explicit timezone-aware timestamps.

## Private storage setup

Set `RESOURCE_STORAGE_DIR` to a persistent private directory writable by the API process. Default: `server/.private-resources`. The dedicated demo uses `server/.demo-resource-files`. Both are ignored by Git. `RESOURCE_MAX_MB=10` is the default; the configured limit must be positive and at most 100 MB. These optional settings are documented in `server/.env.example`; existing `.env` files were not modified.

The storage service checks extension, submitted MIME, PDF header/EOF signature, filename and size, and creates random server-side keys. Paths under this repository's frontend/public directories, traversal and stored symbolic links are rejected. Do not configure any web server/static alias to expose the private directory. Downloads and inline previews pass authentication and eligibility checks, with private/no-store, nosniff and sandbox headers. API selectors expose labels/relationships, not financial/contact records.

Uploads are buffered with a bounded per-request limit; files are written via a temporary file and rename only after complete multipart parsing and metadata authorization. Database creation failures remove the stored file. Process crashes can leave unreferenced files; cleanup retains a 24-hour grace period. **No malware scanner or deep PDF-content sanitization is connected.** Signature checks do not establish that arbitrary PDF content is harmless. A shared/multi-instance deployment would need shared private storage or an object-storage implementation, plus operational scanning, backup and capacity policies. No paid service is required for this development implementation.

`server/services/privateStorage.js` is the storage boundary. A future adapter should implement private write/read/delete operations and preserve resource-service authorization; replace the route's local stream reader and adapt cleanup inventory accordingly. Never switch to public object URLs.

Cleanup requires an explicit matching database and storage directory, without `.env` fallback:

```powershell
# From server; choose the matching database and private directory explicitly.
$env:RESOURCE_CLEANUP_URI = '<explicit MongoDB URI>'
$env:RESOURCE_STORAGE_DIR = '<matching absolute private directory>'
npm run resources:cleanup
# After reviewing the dry-run count:
npm run resources:cleanup -- --delete-unreferenced
```

Only recognized regular files older than 24 hours and unreferenced by **any** resource are candidates. References are checked again before removal. Archived files remain referenced and are retained. Permanent removal of historical resource records is outside this milestone. Back up the database and private files together.

## Schema and compatibility

New collection: `LearningResource`, with compound academic/section/state/publication and uploader/creation indexes, plus a unique file-key index. Notification adds audience, targetClasses and targetSections with backward-compatible defaults. Existing academic calendar model/types are reused. Standard Mongoose index creation applies in development; installations disabling auto-indexing must provision these declared indexes through their normal release process. No destructive migration is needed.

New API groups: `/api/resources` and `/api/communications/{notices,calendar}`. Legacy `/api/notifications`, `/api/academic-calendar` and workflow/dashboard notice reads share eligibility services. Legacy array endpoints retain their shape (bounded at 100); full lists use paginated new endpoints. Existing authentication middleware preserves mandatory password changes and token-version revocation. Existing version/lock and transactional profile/finance tests remain part of regression verification.

## Additive demo data and future testing

The completed base seed remains a no-op. This separate extension adds **8 resources, 3 notices and 2 calendar entries** without resetting the existing 250 Students, 20 Teachers, attendance, finance data or manual edits. Completed extension reruns are also no-ops. An interrupted extension resumes missing deterministic fixture records without overwriting existing ones. Missing files after a completed extension are reported by verification rather than silently recreating edited data.

```powershell
cd server
. ./scripts/demo/use-local-demo.ps1
npm run seed:demo:learning
npm run seed:demo:verify
npm run seed:demo:learning:verify
npm run demo:server
```

Use the dedicated demo database on port 27018 and demo API on 5001, never the normal application database. Existing demo frontend: `http://127.0.0.1:5174`. Default fictional logins: `admin@demo.example.test`, `teacher1@demo.example.test`, `student1@demo.example.test`; password `DemoSchool123!` unless overridden in demo configuration. See the existing demo report for all accounts and placements.

| Scenario | Target | Expected result |
| --- | --- | --- |
| Published English paper | Class 6 A | Student 1 can read/download while eligible |
| Draft English answer key | Class 6 A | Hidden until independently published |
| Fractions study notes | Class 7 A, Mathematics | Available to the matching placement |
| Scheduled English paper | Class 6 B | Hidden until seven days after the base seed date |
| Expired English paper | Class 6 A | Hidden from ordinary file access |
| Archived English paper | Class 6 A | Admin can inspect; ordinary file access denied |
| Admin fractions reference | Class 7 B | Eligible Students can read a school-authorized resource |
| Draft second answer key | Class 6 B | Hidden from Students |

The extension also adds Everyone, Teachers-only and Class 6 A selected notices, plus current-year and prior-year calendar examples. Dates are anchored to the recorded seed date: scheduled examples naturally become live as time passes. Their labels reflect actual publication time rather than freezing a fake state.

Original synthetic documents are in `output/pdf/demo-english-paper.pdf`, `output/pdf/demo-english-answer-key.pdf` and `output/pdf/demo-fractions-study-notes.pdf`. They contain no copied school papers or real student data. `server/scripts/demo/generate-learning-pdfs.py` is an optional authoring script requiring ReportLab and PyMuPDF; ordinary uploads and demo extension use the committed PDFs and require no Python dependencies. All three one-page documents were rendered and visually inspected.

## Verification and browser acceptance

Relevant pre-change baseline was rerun: 227 backend imports, 7 core tests and 381 isolated HTTP checks passed. Integration and demo tests start isolated loopback replica sets and use temporary private file directories; no normal application database is used.

| Final check | Result |
| --- | --- |
| Backend imports / exact-case paths | 235 passed |
| Core regression tests | 7 passed |
| Isolated HTTP/integration checks | 476 passed |
| Frontend tests | 20 passed |
| Frontend ESLint / production build | Passed; existing large-bundle warning remains (approximately 908 KB JavaScript before gzip) |
| Isolated demo safeguards, full seed, additive extension and manual-edit preservation | 4 passed, none skipped |
| Existing dedicated-demo verifier | 38 API checks plus references, conflicts, finance and repeated-seed preservation passed |
| Dedicated-demo learning verifier | 15 API checks, 8 stored PDF size/checksum checks and repeated-extension preservation passed |
| Git whitespace check | `git diff --check` passed |
| Original PDF artifacts | All three rendered, text-extracted and visually inspected |
| Running dedicated demo smoke check | Student login, scoped resource list, authenticated PDF bytes and frontend HTTP 200 passed after restarting the API |

New isolated checks cover authorized uploads and all target sections, unauthorized edits/targets, invalid/oversized/path-manipulated files, metadata failure cleanup, storage failure without metadata/orphans, direct PDF access, independent answer-key release, expiration/archive/restoration and stale versions, assignment revocation, notice audience/time restrictions across endpoint families, date validation, and unchanged attendance/bookings. Cleanup tests cover old orphans, fresh uploads and retained archived references. Existing onboarding, profile/import, academic, attendance, timetable and transactional finance checks also pass.

### Interactive browser spot checks — 2026-10-10

Shared dedicated-demo app only (`http://127.0.0.1:5174`, API `:5001`); synthetic demo accounts and the dedicated demo database were used. Browser: VS Code embedded Chromium, Chrome 150.0.7871.250 / Electron 43.7.7. Default viewport was 1134×674; Student resource library was additionally checked at 390×844. Screenshot captures were inspected inline in the session (Admin resource list and 390px Student library); no durable screenshot file path was produced.

| Scenario | Result |
| --- | --- |
| Admin resource list and details | Pass: all 8 seeded resources and state labels displayed; details showed PDF name, publication metadata and history. |
| Admin PDF preview | Partial: preview dialog and fallback download control opened, but the embedded browser blocked its generated `blob:` frame (`ERR_BLOCKED_BY_CLIENT`). |
| Student 1 Class 6 A resource access | Pass: only the published English paper was listed; draft answer key, scheduled, expired and archived resources were absent. File request returned HTTP 200 with `application/pdf`; browser download-to-disk completion was not observable. |
| Student 2 Class 6 B resource access | Pass: no Class 6 A resource was listed. |
| Teacher resource upload | Pass: uploaded the committed synthetic PDF to Teacher 1's eligible Class 6 A / English / A selection; the named draft appeared in the list. The draft remains in the dedicated demo database and private demo storage as `UI acceptance upload check 2026-10-10`. |
| Invalid upload retention | Pass: a `.md` file was rejected with “Choose a PDF up to 10 MB”; modal remained open with the entered title and rejected file selected; no resource was created. |
| Role-targeted notices | Pass: Teacher saw the Teachers and eligible selected notice; Student 1 saw the Class 6 A selected notice; Student 2 saw only the Everyone notice among the three extension notices. |
| Teacher and Student calendar/timetable/dashboard | Pass: loaded scoped entries. Teacher dashboard labelled timetable-based attendance suggestions as not recorded sessions. Student 1 dashboard/history showed 61 Present / 69 recorded entries (88.41%) and explained missing records are not absence. Student 2 schedule showed Class 6 B placement. |
| Narrow viewport | Partial pass: Student library rendered at 390×844 without document-level horizontal overflow; navigation remained visible. Other pages, tablet and keyboard-only behavior were not checked. |

Full manual acceptance remains **incomplete**. Failed network-save retention, preview rendering/PDF fallback in a regular browser, download-to-disk, keyboard and modal focus behavior, Admin publication/archive/calendar edits, other mobile/tablet layouts and cross-session stale edits remain unverified. The inline captures are not saved screenshot artifacts. These spot checks supplement, but do not replace, the isolated API/integration tests.

Manual acceptance checklist:

1. Log in as Teacher, upload an original PDF to an assigned subject/section; observe actual progress and successful appearance. Attempt an invalid file and a failed save; ensure inputs/file selection remain and buttons unlock.
2. Use keyboard navigation through filters, dialogs and section checkboxes; verify labels, focus trapping/restoration, escape/close and busy protection. Check 375px and desktop widths, including PDF fallback download.
3. Publish the paper and leave its answer key as draft. Log in as eligible Student and another-section Student in separate sessions. Check list, detail, direct preview/file URL, downloaded bytes and independent answer-key release.
4. Change schedule/expiry, archive with a reason and inspect Admin history. Verify stale-save feedback after concurrent edits. Deactivate an assignment and confirm Teacher management access is revoked.
5. Test Everyone, role-specific, whole-class and section-specific notices through dashboard and full pages. Schedule/expire/deactivate/restore; confirm alternate legacy/detail reads cannot expose them.
6. Add each calendar type, filter overlapping date ranges and academic years, then deactivate/restore. Confirm attendance counts and bookings are unchanged.
7. Refresh and navigate between all role pages; verify real counts, empty/loading/error states, cancellation of stale searches and successful downloads on the target browsers.

Next milestone: **effective-dated enrollment, Student transfer/promotion and historical academic records**, with an explicit historical access policy instead of current-placement inference.
