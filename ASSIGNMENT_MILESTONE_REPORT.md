# Assignments, submissions and evaluation — 17 October 2026

## Implemented workflows

The existing enrollment, finance, learning-resource and portal implementations were inspected and preserved. This milestone adds `/admin/assignments`, `/teacher/assignments` and `/student/assignments` within the existing protected layouts, plus Teacher/Student dashboard summaries. It does not convert learning resources into assignments or add exams, a gradebook, enrollment, authentication or finance features.

Staff can create drafts, optionally attach a private PDF, edit instructions/deadlines, publish immediately or schedule publication, close submissions and archive with a reason. Assignment lists have pagination and title/year/class/section/subject/author/state/deadline filters as appropriate to the role. The detail view separates submission/evaluation work from publication/access controls. Teacher rosters show recorded recipients, latest status, submission versions and an evaluation queue. Admin can explicitly add a later joining eligible Student and delegate/revoke another Teacher's access to an individual assignment with an audited reason.

Students see their own assignment history, submit text and/or one PDF, explicitly confirm final submission, and see retained versions and published feedback. Available statuses are Not submitted, Submitted, Submitted late, Returned for revision and Graded. A new version has no inherited grade. Genuine zero marks remain distinguishable from missing work and ungraded work.

Evaluators can save a private draft, publish a grade and feedback, or return work with revision instructions. Corrections to published decisions require a reason and retain before/after history. Evaluation always targets an exact submission version; superseded versions are read-only. Missing work is never automatically marked zero.

## Access and enrollment rules

- Creation and draft target changes reuse eligible academic/teaching relationships. Teachers manage their own authored assignments and assignments explicitly delegated by Admin. A changed TeacherAssignment does not silently transfer access to submissions. The original author retains historical management access while their account/profile remains active.
- Publishing locks academic year, class, subject, target sections, original publication instant and maximum marks. After publication, deadlines/cutoffs may only be extended, and general resubmission permission may only be widened. Important edits require a reason; prior submissions retain their original deadline, cutoff and assignment revision.
- Recipients are captured once. Available publication uses effective-dated enrollment on the publication school date. Scheduled work is materialized on the first authorized assignment API access after release, using that original effective date, rather than the access date.
- Unmanaged profiles, or explicitly initialized profiles whose earlier enrollment is unknown, can use a **current-placement snapshot**. Such recipients record the actual capture date and evidence type; this is not invented historical enrollment. Known later admissions do not automatically join an already captured roster.
- Later joiners need explicit staff addition and must currently belong to a target section. Existing recipients retain their own history after transfer. Current placement alone does not grant access to unrelated assignments.
- Known enrollment recipients remain recorded even if their account is later disabled before a scheduled snapshot is materialized. Existing authentication, password-change requirements, account/profile deactivation and role restrictions remain authoritative. Enrollment withdrawal is not treated as an implicit account-deactivation operation.
- Admin, the author and explicitly delegated Teachers can access the assignment's submissions. Students cannot retrieve another recipient's text, PDF, draft evaluation or audit history, even if both students share the assignment.

## Submission, evaluation and file integrity

Assignment changes, recipient activation, submission and evaluation serialize through a per-assignment transaction lock. The existing MongoDB replica-set transaction requirement remains. Explicit assignment/evaluation revision counters reject stale writes; a submission also checks its expected sequence. Competing reviews or a review racing a new submission cannot overwrite a newer submission's evaluation.

Submission retries use a stable `Idempotency-Key`, actor-bound payload fingerprint and unique indexes. A retry of an already committed submission returns that version, including after closure. Reusing a key for changed work is rejected. The form retains its exact uncertain attempt for retry while open; it does not claim autosave or persistence after browser closure. Different new request keys cannot create duplicate versions from the same expected sequence.

Server time determines publication availability, lateness and cutoff. A submission after the due instant is late. Without a final cutoff, submission remains open until staff close/archive the assignment. A returned current version permits revision even when general resubmission is disabled, but the cutoff/closed state still applies. UI conversion/display uses `SCHOOL_TIMEZONE`; unchanged stored instants preserve seconds despite minute-precision form controls.

PDF handling reuses private storage, size/type/signature/name/path validation and authenticated downloads. Both assignment PDFs and every retained submission-version PDF are referenced by the orphan cleanup service, including archived records. Failed writes and duplicate retry uploads remove their own unreferenced files. Download responses use no-store, nosniff and sandbox headers. There is no malware-scanning claim and no public static file route.

## API and reports

All `/api/assignments` routes use the existing authentication and role middleware.

| Route | Purpose |
| --- | --- |
| `GET /` | Scoped filtered/paginated assignments, historical filter options, real summary counts and nearest deadline preview |
| `POST /` | Staff draft creation; multipart `metadata` JSON and optional `file` PDF |
| `GET /:id`, `PUT /:id` | Authorized detail/history and revision-checked metadata edit |
| `POST /:id/actions` | Publish, close, archive, delegate, revoke or explicitly add a recipient |
| `GET /:id/candidates` | Current eligible later joiners not already recorded |
| `POST /:id/submissions` | Student's confirmed immutable text/PDF version and safe retry |
| `PUT /:id/submissions/:submission/evaluation` | Draft, publish or return an exact current version |
| `POST /:id/seen` | Student acknowledgment of published feedback |
| `GET /:id/file`, `GET /:id/submissions/:submission/file` | Independently authorized private PDFs |
| `GET /:id/export` | Authorized roster/status/latest published-score CSV; all recipients, independent of table pagination |

Exports include Student identity, captured section, submission version/time, lateness, status, maximum marks and published feedback. Draft feedback is excluded. Not submitted, Ungraded and numeric zero remain distinct; cells are quoted and spreadsheet-formula prefixes escaped. Export timestamps explicitly use UTC. Dashboard display uses school timezone and shows real counts and up to three upcoming deadlines. Summary status counts include retained authorized history, as labeled.

## Repeatable demo data and future test guide

Use the existing dedicated `school_erp_demo` setup in [DEMO_DATA_GUIDE.md](DEMO_DATA_GUIDE.md), including its replica set, explicit `DEMO_MONGODB_URI` and private `RESOURCE_STORAGE_DIR`. Then run:

```powershell
npm run seed:demo:assignments --prefix server
npm run seed:demo:assignments:verify --prefix server
```

The extension requires the completed base demo, its established enrollments, active synthetic Teacher/Student and the existing original practice PDF at `output/pdf/demo-english-paper.pdf`. It refuses production/non-demo databases. It adds separate assignment records and private copies; existing learning resources remain unchanged. Deterministic fixture identifiers and a completion manifest make completed reruns preserve manual edits and timestamps. It does not reset data or initialize unknown enrollment history.

| Fixture title (prefixed `DEMO:`) | Expected exercise |
| --- | --- |
| Draft writing task | Teacher/Admin only; edit and publish explicitly |
| Scheduled writing task | Not visible to Students before its stored release time |
| Published task with a genuine zero score | Student 1 sees `0 / 10`, not missing/ungraded |
| Late PDF submission | Student 1's PDF is late; authorized staff can download it |
| Returned for revision | Student 1 sees revision instructions and can submit another version before cutoff |
| Resubmitted work awaiting review | Two retained versions; current version ungraded, old returned feedback retained |
| Closed assignment | Existing submission retained; new submission refused |
| Archived assignment with retained PDF | Own history and authorized retained PDF remain accessible; evaluation read-only |

The fixtures use the Teacher assigned to base Class 6 A English (normally `teacher1@demo.example.test`), `student1@demo.example.test`, and the existing Admin. Other recorded Class 6 A recipients provide Not submitted cases; `student2@demo.example.test` is a different-section isolation check. Credentials remain those documented by the base demo guide. There are **8 assignments, 7 submission versions and 3 evaluation records**. Deadlines are based on the extension's first recorded clock and are not shifted on rerun; old scenarios naturally age past cutoff. Create another manual draft for new interactive work instead of resetting records.

## Verification

| Check | Result |
| --- | --- |
| Full HTTP/integration regression | **753 passed** |
| Focused assignment HTTP suite | **122 passed**, plus transaction/privacy/retention assertions |
| Backend exact-case imports | **250 modules passed** |
| Backend core tests | **7 passed** |
| Frontend tests | **31 passed** |
| Frontend lint / production build | Passed; existing large-bundle advisory remains |
| Isolated full demo, extensions and manual-edit preservation | **4 passed, none skipped** |
| Repository whitespace check | Passed |
| Browser visual/keyboard/download acceptance | Unverified: no connected browser |

Integration and demo checks start loopback-only disposable MongoDB replica sets with isolated private-file directories, never the school's URI. The focused assignment suite additionally tests publication rollback, optimistic revisions, concurrent retries/reviews, return/resubmit policy, cutoff, transfer history, account deactivation, ownership/delegation, safe CSV and retention of old PDF references.

Commands:

```powershell
$env:TEST_MONGOD='C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
npm run test:assignments --prefix server
npm run test:integration --prefix server
npm run test:demo --prefix server
npm run check:imports --prefix server
npm test --prefix server
npm run lint --prefix client
npm test --prefix client
npm run build --prefix client
git diff --check
```

No live school data was changed, pushed or deployed. Existing local changes were preserved.

## Manual acceptance — visual verification pending

Browser inventory returned no connected apps or browsers. Desktop/tablet/mobile appearance, native downloads and keyboard interactions are **unverified**. On a disposable demo:

1. Open Assignments through all three role menus. Check 375px, tablet, desktop and zoom; confirm readable nested tables and no page-wide overflow.
2. Create a Teacher draft with text/PDF and eligible sections. Test required fields, unsupported/oversized PDF, slow/failed save and retained input. Inspect scheduled publication using the displayed school timezone.
3. Exercise Tab/Shift+Tab, focus restoration, Escape, busy prevention, mobile file selection and the warning before leaving unsaved submission/evaluation work.
4. Submit text, PDF and both. Simulate a lost response and retry the exact attempt; confirm one version. Pass the cutoff while that form remains open and retry the committed request. Close the browser only after recording/reconciling an uncertain outcome; there is no autosave.
5. Review the exact current version. Save private feedback, check it is hidden from the Student, publish a genuine zero, return for revision, resubmit and verify the new version has no old score. Try two concurrent review tabs and a concurrent Student resubmission.
6. Correct published feedback with a reason and inspect history. Switch between review/publication tabs or Students with unsaved edits and verify the discard warning.
7. Transfer a recipient, explicitly add a later joiner, change a teaching assignment, delegate/revoke another Teacher and test direct detail/PDF URLs in separate sessions. Deactivate an account and verify access is denied.
8. Filter by old subjects after transfer. Compare roster/status/published-score CSV and dashboard counts, including Not submitted, Ungraded, zero and formula-like Student names. Mark feedback read and refresh the list/dashboard to verify the indicator clears.
9. Close/archive and verify history/PDF retention. Recheck existing attendance, timetable, learning resources, notices/calendar, enrollment, fee/salary, profile and import/export screens; backend regression checks do not substitute for browser acceptance.

Operational limits: scheduled materialization is lazy rather than a background scheduler; fallback evidence is explicitly a current snapshot; PDF malware scanning and an in-browser autosave facility are not supplied. Assignment summaries/details currently aggregate the authorized roster/history in memory, while assignment lists are paginated; very large schools may need aggregation/paginated history endpoints. The existing frontend large-bundle advisory remains.
