# Effective-dated enrollment milestone

The existing navy/gold Admin dashboard, shared shell and original school logo were confirmed in the repository and preserved. Public pages and unrelated local changes were retained. No live school database, existing demo database, push or deployment was modified during implementation. Verification uses disposable, loopback-only replica sets.

## Completed workflows

- Admin **People → Enrollments**: search by admission ID/name, year/class/section, roll, status and effective date range; inspect chronological placements and actor/reason audit; export selected-year XLSX with academic labels.
- New Student creation creates User, permanent Student identity and initial admission in one transaction. The existing creation form accepts an explicit effective start and backdate reason.
- Existing Student transitions support admission after an exit, class/section transfer inside the same year, promotion/repeat into a later year, withdrawal and completion. Preview shows the source, destination, date and attendance impact before confirmation.
- **Promotion / rollover**: source year/class/section, selection across pages (100 maximum), explicit promote/repeat/complete/skip, destination and effective date, manually chosen destination rolls, per-student conflict preview, atomic commits and exact partial results. Retry preserves transition IDs. Run separate batches when destination classes or dates differ.
- Student profile shows today's placement and an own-only read-only timeline. Personal attendance remains available across transfers and exits. Account/profile activation remains separate from enrollment status.
- Read-only legacy readiness audit is available in Enrollments. Initialization and index changes are operator commands only.

## Dates, concurrency and access

Intervals are **[startDate, endDate)**: a transfer on 2026-10-05 ends the old placement before that date and starts the new one on that date. Academic-year end dates remain inclusive; enrollment stores the following date as its exclusive end. Strict YYYY-MM-DD values represent school calendar days; “today” uses `SCHOOL_TIMEZONE` (default Asia/Kolkata).

Future effective dates are rejected. A transition must be after the latest start; inserting or rewriting older intervals is intentionally unsupported. Promotion/repeat requires a later non-overlapping academic year. Current-year selection alone never promotes a student.

Enrollment contains the opening transition type and previous enrollment; closing type, actor, timestamp and reason preserve transfers/exits without creating fake zero-duration intervals. `EnrollmentTransition` records every admission/transfer/promotion/repeat/withdrawal/completion and its idempotency fingerprint. Effective status distinguishes an expired interval from a current one.

Student class/section/roll fields are maintained **latest-placement projections**, retained after withdrawal for legacy labels. They are not evidence of historical or current enrollment. Date-sensitive roster, timetable, audience and current counts resolve Enrollment. Admin People profile/export fields retain their latest-placement meaning; use Enrollments for year-specific history.

Transactions serialize on Student and destination/source Section writes; interval queries reject both student overlaps and overlapping year/class/section/roll use. Preview tokens are signed, actor-bound and expire after 15 minutes. Commit repeats validation and checks the loaded enrollment revision/source. Reusing a committed ID with identical input is harmless; different input is rejected. After expiry, re-preview the same original ID/input for retry; do not alter committed decisions in place.

Backdated impact checks include locked and inactive attendance at/after the transition. An incompatible record blocks the transition. Fees, payments, balances, resources and assignments are never moved, generated, deleted or marked paid. Academic-year date edits are blocked once enrollments exist; existing class/section/assignment relationships remain immutable.

Attendance rosters and historical roll labels resolve enrollment on the attendance date. Recorded IDs, version checks, locks and assignment permissions remain intact. A session containing unresolved pre-cutover enrollment is readable but cannot be corrected by replacing its roster. Present-only percentage and the recorded student-period denominator are unchanged; missing sessions never imply absence. Historical corrections still require an eligible active teaching assignment and active academic setup under the existing policy.

Students retain personal attendance across years; current timetable, PDF resources, targeted notices and calendar audiences use only today's placement. An exited student retains personal history, but receives no former-class schedule/resources. Uninitialized legacy students retain the explicitly marked latest-placement compatibility path for today's portal access until cutover; it never establishes historical attendance eligibility. Staff-only transition actor/reason information is omitted from Student timelines.

## Initialization and index transition

The old unique `Student(schoolClass, section, rollNumber)` index conflicts with historical roll reuse. Its schema declaration was removed, but installed indexes are **not** dropped by application startup or API calls. Transitions return a clear readiness error until an operator performs the explicit index step. New overlap indexes support service queries; transactional service validation enforces interval uniqueness.

Choose a cutover supported by evidence. Do not substitute admission dates, first attendance dates or year starts for unknown history. The plan identifies inactive/missing relationships, invalid/duplicate legacy rolls, existing interval overlaps, year-boundary conflicts and incompatible attendance. Initialization creates only the known placement from the explicit cutover onward, records that earlier history is unresolved and skips already-managed students. Each student's failure rolls back independently; reruns preserve completed work.

Example **copy/synthetic database** commands from the repository root (replace the database and Admin ID deliberately):

```powershell
$env:ENROLLMENT_DB_URI = 'mongodb://127.0.0.1:27018/enrollment_copy?replicaSet=demoRs'
npm run enrollment:audit --prefix server -- --database enrollment_copy --cutover 2026-10-16
# Review the plan before the explicit index operation:
npm run enrollment:init --prefix server -- --database enrollment_copy --cutover 2026-10-16 --transition-index --confirm-database enrollment_copy
npm run enrollment:init --prefix server -- --database enrollment_copy --cutover 2026-10-16 --apply --confirm-database enrollment_copy --actor <ACTIVE_ADMIN_OBJECT_ID>
# Repeat audit/apply to inspect exact outcomes and safely resume.
```

The command does not load `.env` or fall back to the application URI. URI database and `--database` must match; `dbName` overrides are rejected. Auto-index/auto-create are disabled during audit. Mutation requires the exact database confirmation; apply also requires an active Admin. The index step creates Enrollment/transition indexes and drops only the verified legacy scoped-roll unique index, after readiness checks. It never deletes records. These commands were not run against live school data.

## Import/export compatibility

Old Student workbook headers remain accepted. New templates append optional `enrollmentStart` and `enrollmentReason` columns. Blank start means school today; backdated creation requires a reason. Both are creation-only. Existing placement/roll changes via profile forms and import preview/commit are rejected with directions to Enrollments. Ordinary identity/contact edits, account onboarding, email/password controls and Teacher management remain unchanged. Prefer admission ID when matching updates, since historical reuse makes a latest-projection roll insufficient as permanent identity.

The selected-year enrollment XLSX exports each matching interval with labels, inclusive/exclusive dates, status and opening transition. Export includes all matching pages; run it when enrollment edits are idle for a stable report (it is not a database snapshot).

## Repeatable demo extension

`server/scripts/demo/extend-enrollments.js` adds separate fixtures without resetting or overwriting existing demo records. It requires the exact guarded `school_erp_demo` database, a completed seed, writable replica set and prepared enrollment indexes. It records a resumable manifest; a completed rerun does no writes. New demo seed creation now establishes explicit fictional 2026-04-01 admissions; rerunning an existing seed never backfills history or changes manual edits.

```powershell
$env:DEMO_MONGODB_URI = 'mongodb://127.0.0.1:27018/school_erp_demo?replicaSet=demoRs'
$env:JWT_SECRET = '<DEDICATED_DEMO_SIGNING_SECRET>'
npm run seed:demo:enrollments --prefix server
npm run seed:demo:enrollments:verify --prefix server
npm run seed:demo:verify --prefix server
```

For an older demo with the installed legacy index, first run the explicit initialization audit/index commands above using **school_erp_demo** as the selected database. The extension never drops that index itself. It does not initialize the original 250 legacy students.

| Fictional account | Expected scenario |
| --- | --- |
| transfer@enrollment-demo.example.test | Class 6 A → B on 2026-10-05; Present sessions on 2026-10-03 and 2026-10-06 |
| promotion@enrollment-demo.example.test | Prior-year Class 5 → current-year Class 6 on 2026-04-01 |
| repeat@enrollment-demo.example.test | Prior-year Class 5 → current-year Class 5 (repeat) on 2026-04-01 |
| completion@enrollment-demo.example.test | Prior-year enrollment completed at exclusive 2026-04-01 end; no new placement |

Expected extension totals: **4 students, 7 enrollment intervals, 8 transition events, 2 attendance sessions**. Initial password uses `DEMO_PASSWORD` (existing demo default `DemoSchool123!`); these new accounts retain required first-password-change onboarding. Verification rejects student overlap, scoped-roll overlap and an invalid backdate. No exam eligibility or fee obligation is inferred.

## Verification and manual acceptance

Frontend lint, 25 frontend tests and production build pass. Backend exact-case/import check covers 241 modules; all 7 core tests pass. The isolated replica-set suite passes 565 HTTP/integration checks covering concurrent transitions, retries, stale previews, historical corrections, portal access, initialization rollback/repeatability and existing ERP regressions. All 4 demo tests pass with no skips, including the full seed, learning/enrollment extensions, combined verification and fingerprint checks proving reruns preserve manual edits and enrollment records. `git diff --check` passes; Git emits only existing CRLF conversion notices. Vite retains its large-bundle advisory.

Executed from the repository root: `npm run lint --prefix client`, `npm test --prefix client`, `npm run build --prefix client`, `npm run check:imports --prefix server`, `npm test --prefix server`, `npm run test:integration --prefix server`, `npm run test:demo --prefix server`, and `git diff --check`. Replica-set tests used `TEST_MONGOD=C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe` with temporary databases and random loopback ports; neither uses the school's URI.

Browser inventory returned no connected apps/browsers. **Desktop/mobile visual and keyboard acceptance is unverified.** On a disposable replica-set database:

1. At desktop/tablet/mobile widths open Admin Enrollments and Promotion / rollover. Check sidebar drawer, focus, Escape, labels, table scrolling, loading/empty/error/retry states and filters.
2. Admit a synthetic student with an explicit known start. Verify one User/Student/enrollment, onboarding and unchanged admission ID.
3. Record attendance, preview a later transfer, cancel, then confirm. Verify preview makes no writes; invalidating backdates and occupied rolls show errors. Double-submit/retry produces one transition.
4. Review attendance before/on/after the boundary. Historical roll stays correct; old authorized teacher can correct established historical sessions, while unrelated teachers cannot access them. Locked and unresolved legacy sessions remain protected.
5. Log in as the Student: current timetable/resources/notices follow destination; own historical attendance and timeline remain visible, with no classmates' history or staff audit reasons.
6. Preview promote/repeat/complete/skip using a past source year and different destination rolls. Change one student concurrently, then commit: verify exact partial results, stale conflict and safe retry. Confirm current-year switching alone does not move students.
7. Export a selected year; inspect all labels, dates and rows. Recheck profile edits, old/new workbook templates, imports, timetable/attendance exports, PDFs, notices/calendar and existing finance records.
8. On a copy only, audit unresolved legacy students, inspect blocked reasons, run an explicit cutover and rerun. Earlier records stay readable without invented enrollment. Check deliberate initialization failure rolls back the affected student.

Next milestone: **Admin fee management, receipts/reversals, Student fee views and Teacher salary views using the existing finance APIs.**
