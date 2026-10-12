# Demo Vidya School — local testing guide

This fictional dataset is isolated in **school_erp_demo**. It does not change real school branding, existing `.env` files, or live school records. The full reusable account/placement/scenario report is **DEMO_DATA_REPORT.md**, with a password-free machine-readable catalog at **demo-data/catalog.json**.

## Start the demo (PowerShell)

Use three terminals. Commands below start from the repository root. If the demo database is already running on port 27018, keep that terminal running rather than starting another copy.

Terminal 1 — dedicated database:

```powershell
cd server
npm run demo:db
```

This starts a loopback-only single-node replica set named `demoRs`, default port 27018, with persistent data under ignored `server/.demo-data/port-27018`. It never uses the normal MongoDB Windows service or port 27017. Keep the terminal open; Ctrl+C stops this demo process. Restarting the command preserves its data. Windows default executable is MongoDB 8.3 under Program Files; set `DEMO_MONGOD` to another installed executable if necessary. An occupied port is an error, never permission to modify another instance.

Terminal 2 — seed, verify, then start the demo API:

```powershell
cd server
. .\scripts\demo\use-local-demo.ps1
npm run seed:demo
npm run seed:demo:verify
npm run demo:server
```

The dot-sourced helper sets the dedicated `DEMO_MONGODB_URI`, school timezone, API port 5001 and frontend origin for this terminal without printing database connection details or changing files. It never sets or falls back to normal `MONGO_URI`. `demo:server` does not import the normal `.env` or normal server startup; it connects only after the demo database guard succeeds.

Terminal 3 — demo frontend:

```powershell
cd client
. ..\server\scripts\demo\use-local-demo.ps1
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open **http://127.0.0.1:5174/login**. Use this exact origin with the default demo CORS setting. Frontend `VITE_API_URL` points to the demo API on port 5001 and overrides any existing client environment value for this process only. The ordinary app on ports 5000/5173 is unaffected. Avoid logging demo accounts into the ordinary frontend.

These commands assume existing dependencies are installed. If needed, run `npm ci` separately in `server/` and `client/`. No new dependencies were added for the seed tool.

## Demo credentials

Default development-only password: **DemoSchool123!**.

| Login | Scenario |
| --- | --- |
| admin@demo.example.test | Admin setup, dashboard, timetable, attendance review |
| teacher1@demo.example.test | Class 6 A English; Class 10 B Mathematics; Class 10 A Science |
| teacher2@demo.example.test | Class 6 B English; Class 6 A Mathematics; Class 10 B Science |
| student1@demo.example.test | Class 6 A, roll 1, high recorded attendance |
| student2@demo.example.test | Class 6 B, roll 1, medium recorded attendance |
| student3@demo.example.test | Class 7 A, roll 1, low recorded attendance |
| student249@demo.example.test | Inactive login rejection; Class 10 A, roll 25 |
| student250@demo.example.test | Inactive login rejection; Class 10 B, roll 25 |

All teacher1–teacher20 and student1–student250 login names follow the same pattern. The report lists every fictional name, admission/employee ID, class, section and roll. No ordinary API returns passwords. Passwords are hashed by the existing User save hook, never by an ad hoc hash routine.

To override the default, set `DEMO_PASSWORD` before the **first seed** and provide the same value to `seed:demo:verify`. The custom value is never printed or stored in the report. Changing this variable after a completed seed does not reset existing account passwords. Use an explicit reset for a new set of credentials. `DEMO_JWT_SECRET` optionally replaces the dedicated development-only token secret; normal `JWT_SECRET` is not reused by demo tooling.

## Reproducibility and reset

On first creation the seeder uses the actual school date in `SCHOOL_TIMEZONE` (default Asia/Kolkata). For a fixed historical fixture:

```powershell
$env:DEMO_SEED_DATE = '2026-10-09'
$env:DEMO_RANDOM_SEED = 'vidya-2026-v1'
npm run seed:demo
```

Dates must be within 2026-04-01 through 2027-03-31 and have at least one completed working day in that year. Outside-year dates stop with instructions rather than creating invalid records. Fewer than 15 completed days near the start of the year produces a shorter valid attendance window. Upcoming calendar dates near year-end are clamped to the final valid day. Notice visibility uses the real application clock; it is not frozen at the seed date.

The manifest stores the chosen date, timezone, random seed, baseline counts and sample session IDs. **A completed normal seed rerun is a no-op:** it neither duplicates records nor repairs/deletes/overwrites manual edits, resets credentials, advances dates, recreates deleted demo records, or replaces the report. A partial failed seed refuses continuation and requires explicit reset after inspection. Concurrent initial seeds are serialized by a unique manifest identifier.

To discard all manual testing and rebuild only this demo database:

```powershell
# Stop the demo API first; keep the dedicated demo database running.
npm run seed:demo:reset -- --confirm-demo-reset
Remove-Item Env:DEMO_SEED_DATE -ErrorAction SilentlyContinue
npm run seed:demo
npm run seed:demo:verify
npm run demo:server
```

The reset refuses missing confirmation, production mode, every database name other than exactly `school_erp_demo`, and any unrecognized database without this seed tool's manifest. It drops only the explicitly selected demo database, not the MongoDB instance or its data directory. It does not delete the old report; the next successful fresh seed replaces it. Do not treat a report left after reset as proof that the database is populated.

For a different replica set, explicitly configure `DEMO_MONGODB_URI` with the exact demo database name. No normal URI fallback exists. Runtime commands never print URIs, database credentials, tokens or hashes. Use a development terminal; `NODE_ENV=production` is refused.

## Dataset and design

- Two years: 2025–2026 (setup/calendar only) and current 2026–2027. No invented prior-year enrollment or attendance.
- Five current-year classes (6–10), A/B sections, 25 Student profiles each: 250 total. Students 249/250 and their accounts are inactive from creation; 248 active profiles receive attendance and fees. Class 10 A/B therefore have 24 currently eligible students each.
- 20 active teachers, 30 class-owned subjects, 60 subject/section assignments, 10 authoritative class-teacher assignments consistent with Section.classTeacher.
- Five teaching periods plus a break; 300 Monday–Saturday bookings with fixed unique section rooms. Each teacher teaches three assignments across different sections and receives 15 weekly bookings. Scheduling goes through the existing transactional service; no conflict guard is disabled.
- Approximately 15 completed working days: majority Present, varied Absent/Late/Half Day/Leave, high/medium/low student patterns, intentionally unmarked sessions, 3 corrections, 3 deactivations, and a mixture of locked/unlocked sessions. Seed-day attendance starts empty for fresh marking tasks; Sunday correctly has no scheduled lessons.
- Five calendar entries including upcoming events/holiday/assessment-date references and one truthful prior-year closing event; no exam/results feature. Five notices include two published, one future, one expired and one inactive relative to the seed date.
- One annual fee structure; 248 student fees; 11 fee payments including a reversal. Twenty salary structures/monthly salaries and five salary payments including a reversal. Pending/partial/full balances derive from real payment records using the existing transactional/idempotent payment services. Salary records use the existing generation API. All money is fictional; no bank credentials are present.

Core fixture IDs, admission/employee identifiers, schedules, attendance keys, random choices and payment idempotency keys are deterministic. Service-generated payment/salary document IDs, password salts and audit/creation timestamps remain server-generated. Account/profile pairs are created transactionally using existing User hooks; student validation and academic relationship checks are reused. Direct model writes for fixed setup/identity records are limited to this guarded demo database and are followed by full reference, balance and schedule validation.

## Verification and future testing

`seed:demo` verifies a newly created dataset and generates the report. `seed:demo:verify` checks baseline counts, references, current year, class teachers, timetable conflicts, roster eligibility, explicit statuses, lock/version audits, balances/reversals, and scoped login/API behavior. It checks a complete in-memory data fingerprint before/after a normal seed rerun to prove no documents change; the fingerprint is not printed. Verification does not correct manual changes. It may report baseline drift after legitimate manual testing; use the report to interpret it and reset only when you intend to discard those edits.

To explicitly refresh the reusable report from a verified baseline without changing database records:

```powershell
npm run seed:demo:report
```

This writes `DEMO_DATA_REPORT.md` and `demo-data/catalog.json`, including all 250 student logins, 20 teacher logins, sample session dates/subjects/owners, personal percentage checks, finance totals and the verification timestamp. Normal seed reruns still leave reports and manual edits unchanged. If verification reports drift after manual testing, keep the previous baseline report for comparison; this command will not silently reset the database.

Safety/reset tests:

```powershell
$env:TEST_MONGOD = 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
npm run test:demo
npm run test:integration
```

These test commands use independent disposable replica sets, not the live school database. The destructive reset test operates on an isolated temporary demo database. Baseline application regression tests remain separate from persistent demo data.

## Verification recorded on 2026-10-10

The persistent demo passed structural and financial verification and 38 scoped API checks. Its original seed date remains 2026-10-09. All four demo tests passed, including a complete fresh seed in a disposable replica set, preservation of a manual teacher edit on rerun, and guarded reset. Application checks passed: 222 backend imports, 7 backend core tests, 313 integration tests, 9 frontend tests, frontend lint and production build. The build retains a large JavaScript chunk warning.

The dedicated demo API and frontend passed HTTP, CORS and API-target checks on ports 5001 and 5174. No browser was connected, so visual acceptance remains unverified; use the checklist below. No live school database was changed.

## Manual browser checklist — unverified until performed

1. Admin login → Dashboard → Academic Years/Classes/Sections/Subjects/Periods → Students → Teachers → Assignments → Timetable → Attendance review. Compare counts with DEMO_DATA_REPORT.md; use Inactive filters for students 249/250 and inactive attendance.
2. Teacher 1 login → today’s lessons → mark an unmarked task on the seed date. Confirm Unmarked rows cannot save; use Mark all Present, then change a few statuses. Without a current-date task, select the report's seed date manually. Sunday has no timetable task.
3. Open Teacher 1's unlocked sample session from the report. Edit; use two tabs to test stale-version rejection. Block a save request to check field retention. Try Close, Back, navigation and logout with unsaved changes; confirm guards.
4. Teacher 2 login: compare different assignments/schedules. Attempt Teacher 1 assignment IDs; unauthorized roster access must fail. Neither Teacher may lock/unlock records.
5. Student 1 login → own timetable/history; verify their newly recorded status and Present / recorded-period denominator. Student 2 has different section history and cannot see Student 1's entry. Missing sessions do not add absence.
6. Admin locks/unlocks with reasons, reviews audit history, and tests correction/deactivation confirmations. Locked records cannot be edited through an alternate endpoint. Deactivated attendance cannot currently be restored or recreated using the reserved unique key.
7. Check future/expired/inactive notices against their dates and the real current clock. Financial APIs/dashboard totals exclude reversed payments; no new finance screens were added.
8. Test 1440/1280 px desktop and 390/768 px mobile: navigation, grid/list, horizontal table scrolling, keyboard entry, native dialog focus, field labels, loading/errors/retry and inactive-account rejection. Capture screenshots and record actual results.

## Existing limits

Expanded profile/import testing is documented in [PROFILE_MANAGEMENT_REPORT.md](PROFILE_MANAGEMENT_REPORT.md). Run `npm run seed:demo:workbooks` from a server terminal with the dedicated demo environment selected to regenerate the four Student/Teacher create/update example workbooks in `demo-data`. This command previews the files and performs no imports. Fresh seeds include additional guardian/admission and Teacher emergency-contact fields; completed demo seeds preserve existing records.

Browser acceptance is separate from API verification. The application has only current placement, not effective-dated enrollment; historical correction eligibility limitations remain. Attendance deactivation has no restore API. Demo reset is destructive only to the demo DB. Today/notice visibility advances with real time; rebuild explicitly for a fresh current-day demo. Production migration/index readiness is not established by this dataset. No push or deployment is included.
