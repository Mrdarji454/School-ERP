# School ERP

React/Vite/Tailwind frontend (`client/`) and Express/Mongoose API (`server/`) for Admin, Teacher, and Student accounts. Includes academic management, timetable management, attendance review, and scoped Teacher/Student portals. The public school website is preserved.

## Setup

Use a Node.js version supported by the checked-in Vite version (verified here with Node.js 24.10.0). Install each package from its lockfile:

```powershell
cd server
npm ci
Copy-Item .env.example .env
cd ../client
npm ci
Copy-Item .env.example .env
```

Set `server/.env` and `client/.env` locally. Never commit credentials. The client defaults to `http://localhost:5000/api`; `VITE_API_URL` must include `/api`.

| Server variable | Purpose |
| --- | --- |
| `MONGO_URI` | MongoDB connection URI, including the replica-set name when applicable |
| `JWT_SECRET` | Random secret of at least 32 characters |
| `PORT` | API port, default `5000` |
| `CLIENT_ORIGIN` | Allowed frontend origin, default `http://localhost:5173` |
| `SCHOOL_TIMEZONE` | IANA school timezone, default `Asia/Kolkata` |
| `NODE_ENV` | Runtime environment |
| `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` | Used only by the initial-admin setup command |

**MongoDB must support transactions:** use a replica set, including a single-node replica set for local development, or a suitable managed MongoDB cluster. Account/profile creation, profile activation, scheduling writes, financial changes, and current-year changes use transactions. A standalone MongoDB deployment returns `503` for these operations rather than writing partial data.

For a new local database, start `mongod` with a dedicated data directory and `--replSet rs0 --bind_ip 127.0.0.1`, then initialize that replica set using `mongosh` and `rs.initiate()`. Do not repurpose an existing school database directory for testing.

In `server/`, set the three initial-admin variables and run:

```powershell
npm run bootstrap:admin
```

This command refuses to create an initial administrator when one already exists. Remove the initial-admin environment values afterward. Public registration is disabled. An authenticated Admin may create another Admin through `POST /api/auth/register`; Teacher and Student accounts are created through their respective profile endpoints.

Run the API and frontend in separate terminals:

```powershell
# server/
npm run dev
# client/
npm run dev
```

The server connects to MongoDB and verifies model indexes before listening. It refuses startup if required indexes cannot be created.

## Existing-data preflight

Before using this revision with an existing database, take a backup and run `npm run audit:data` from `server/`. This is a read-only audit: it reports duplicate-key group counts, inconsistent balance counts, multiple current years, legacy ObjectId period numbers, and old student parent-name fields without printing personal records.

Review any findings on a database copy. Unique indexes now protect account identifiers, attendance, fee assignments, monthly salaries, current years, class-teacher assignments, and payment retry keys. Existing duplicates can prevent index creation; the application does not automatically merge, delete, or rewrite financial history. Historical `fathername`/`mothername` fields and nonnumeric period numbers require an explicit reviewed data migration if present. The audit is a preflight aid, not a complete migration tool.

## Contracts and access

- Responses use `{ success, message?, data }`; validation errors provide safe field names/messages without submitted values. Password hashes are excluded from normal queries and JSON responses.
- Authentication uses a seven-day bearer JWT. The browser verifies saved tokens through `/auth/me`; any API `401` clears its session. Login and protected requests check both active accounts and active role profiles. Logout clears the browser's token/state; it does not revoke already-issued JWTs on other devices.
- Student identity is `student.user.fullname` / `student.user.email`; academics use `schoolClass` and `section`; parent fields use `fatherName` / `motherName`. Dates use ISO date input values. Creation requires an eight-character password; editing can omit it.
- Admins manage students. Teachers may read only active students in their eligible assigned class/sections. Student accounts cannot list other students. Deactivation/restoration changes the account and profile together. Identifiers use UUID-based admission/employee values with unique indexes.
- Student list/search/filter/pagination are preserved after mutations. Statistics cover all matching records, not just the current page; active/inactive totals ignore the status selector to show both populations. API academic-year filtering derives membership through classes; the unfinished frontend year selector was removed.
- `PATCH /students/:id/restore` restores a student. Imports accept `.xlsx` only, up to 5 MB and 1000 rows, with exact sample-template columns. `/students/sample` downloads that template. Each row names an academic year, class, and section; blank admission numbers are generated. Per-row successes/errors are returned. Export is a report, not a password-bearing reimport template. Only new rows receive password hashing, exactly once.
- Academic relationships must be active and consistent. Moving an existing class, section, subject, or assignment between parents is rejected to preserve historical references. Create a new relationship instead. Class, section, subject, assignment, period, calendar, and financial soft-restoration endpoints use `PATCH /:id/restore`; academic years retain `PATCH /:id` for restoration.
- Timetables support list, single record, class (`/timetables/class/:classId`), and teacher (`/timetables/teacher/:teacherId`) reads. Teacher and Student reads are scoped. Admins create/update/deactivate schedules; updating an inactive timetable reactivates it after conflict checks. Conflicts cover overlapping time intervals for teachers, class/sections, and normalized room names. Concurrent writes serialize by academic year; changing a scheduled period's time requires a new period.
- Attendance writes and reads are limited to the teacher's eligible assignments or Admin. Student `/attendance/me` returns only the caller's entries and omits staff remarks. Input dates are school calendar dates in `YYYY-MM-DD`, stored as UTC-midnight date keys, within the assignment's year. Duplicate students, invalid statuses, break/inactive periods, and cross-class updates are rejected. Locked records cannot be edited or deactivated; inactive records still reserve their unique attendance key.
- Dashboard data uses the selected/current active year and school timezone. A missing current year produces an explicit error. Ordinary users see only active, published, unexpired notices; notice management is Admin-only.

## Finance

Mounted existing endpoints: `/fee-structures`, `/student-fees`, `/fee-payments`, `/salary-structures`, `/teacher-salaries`, `/salary-payments`. Management is Admin-only; payment-history reads are scoped to the relevant Student or Teacher.

For each payment, send a stable `Idempotency-Key` header (8–128 letters/digits/colon/underscore/hyphen). Retry the same request using the same key. Reusing it with different payment details returns `409`. Nonempty external transaction/reference IDs are also unique. Payments and balances commit atomically; amounts use two-decimal minor-unit calculations and concurrent overpayment is rejected.

`DELETE /fee-payments/:id` and `DELETE /salary-payments/:id` now **reverse** the payment and preserve its record. Send `{ "reason": "Correction reason" }`. Repeating a reversal does not change the balance again. Histories expose reversal metadata; collected-fee totals exclude reversed payments. Assigned student fees may change `totalAmount` only before any payment history exists. Fee/salary structure changes do not rewrite previously issued balances. No payment gateway is included.

## Verification

```powershell
# client/
npm run lint
npm test
npm run build

# server/ (install client dependencies too for the form-contract test)
npm run check:imports
npm test

# Set this to your installed MongoDB server executable:
$env:TEST_MONGOD = 'C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
npm run test:integration
```

The integration suite launches its own loopback-only replica set on a dynamically allocated port, creates a new data directory under ignored `server/.test-data/`, uses only synthetic accounts, and shuts the process down afterward. It never loads `.env`, reads `MONGO_URI`, connects to the real school database, or deletes existing data. Test directories are retained for diagnosis.

Verified repairs include student login/list/create/edit/filter/import/export/deactivate/restore, account/profile rollback, role and ownership restrictions, academic CRUD/restoration, schedule overlap/concurrency, attendance lock/duplicate handling, notices, dashboard, fee/salary payments, and reversal consistency. See `REPAIR_REPORT.md` for the latest results.

## Policy assumptions and remaining work

- Attendance summaries count **student-period records**, not unique students per day. The existing Present-only numerator is retained; all five statuses, including Half Day, are included in the denominator. Late/Half Day weights, daily rollups, automatic locking, future-date limits, and requiring a weekly timetable booking for every attendance entry need an explicit school policy.
- JWT logout is local; there is no central token-revocation/session store.
- Teacher/Student dashboards and timetable/attendance workflows are implemented. The complete browser-driven workflow still needs visual verification when a browser is connected; see `WORKFLOW_MILESTONE_REPORT.md`.
- Live-data migration/readiness has not been tested. The production build retains a large-chunk warning; bundle splitting is a later optimization.
- Next milestone: mock-test document uploads and learning-resource access, with calendar/notice screens completed where still missing. Complete pending browser acceptance before rollout.

## Admin academic and teacher management

Seven protected Admin screens are available at `/admin/academic-years`, `/admin/classes`, `/admin/sections`, `/admin/subjects`, `/admin/periods`, `/admin/teachers`, and `/admin/teacher-assignments`. Navigation includes these screens, Dashboard, and Students; unfinished modules are not advertised. Public school pages are unchanged by this milestone.

The screens reuse existing write APIs. Academic-year current selection is `PATCH /api/academic-years/:id/current`; year restoration is `PATCH /api/academic-years/:id`; other resources restore via `PATCH /api/:resource/:id/restore`. Initial teacher passwords are entered only during creation. Ordinary profile edits omit passwords and payroll fields; employee IDs come from the server.

New read-only endpoints, all requiring Admin:

| Endpoint | Contract |
| --- | --- |
| `GET /api/admin-management/:resource` | The seven resources above; `{ success: true, data: { records, pagination: { page, limit, total, totalPages } } }`. Accepts `search` (literal, max 100 characters), `status=all/active/inactive`, `page` (positive), `limit` (1-100). Omitted status includes all records; UI defaults to active. Out-of-range pages clamp to the last page. |
| `GET /api/admin-management/options` | Minimal historical labels and relationship IDs in `years`, `classes`, `sections`, `subjects`, `teachers`; `eligible` identifies valid new selections. Teacher labels contain no contacts, credentials, or payroll/profile fields. |
| `GET /api/admin-management/classes/:id/dependencies` | Counts of linked `sections`, `subjects`, `students`, `assignments`, each with `active` and `total`. No changes or cascade operations. |

List filters: `academicYear` for classes/sections/subjects/teacher assignments; `schoolClass` for sections/subjects/teacher assignments; `section` and `teacher` for assignments. Teacher search includes name/email/employee ID; assignment search includes teacher and subject labels. Existing list APIs and their access rules remain available for compatibility.

The shared academic-year filter is retained in session storage across management screens. New dependent selectors show eligible records; historical relationships remain labelled and read-only on editing where the API prohibits reassignment. Refresh/retry actions, request cancellation, mutation guards, and inline errors protect the editing workflow. No schema or index changes were added in this milestone.

See [ADMIN_MANAGEMENT_REPORT.md](ADMIN_MANAGEMENT_REPORT.md) for verification and [UI_ACCEPTANCE_CHECKLIST.md](UI_ACCEPTANCE_CHECKLIST.md) for pending desktop/mobile acceptance.

## Timetable and attendance portals

Admin: `/admin/timetable` and `/admin/attendance`. Teacher and Student each have `/teacher/...` or `/student/...` routes for `dashboard`, `timetable`, and `attendance`. Teacher attendance supports timetable suggestions and independent authorized assignment selection. Suggested tasks are explicitly distinguished from recorded sessions. Student history contains only the authenticated student's period-wise entries, with Present count / recorded student-period count and the policy explanation.

Scoped read APIs under `/api/workflow` all require authentication:

| Endpoint | Access and response |
| --- | --- |
| `GET /options` | Minimal assignment/period labels, eligibility, school `today`, `day`, `timeZone`; Teacher sees own assignments; Student sees current-placement and own recorded-history references. Student also receives minimal placement labels. |
| `GET /timetables` | `{ records, days }`; Admin can include inactive bookings. Teacher scope derives from authenticated profile; Student scope derives from current class/section. Filters: `academicYear`, `schoolClass`, `section`, `teacher`, `day`; `status=active/inactive/all` only broadens Admin reads. |
| `GET /roster?teacherAssignment=...&period=...&date=YYYY-MM-DD` | Admin/Teacher only; validates eligible assignment ownership, school date and teaching period; returns `{ roster, record }`. Existing inactive sessions remain discoverable because their uniqueness key is reserved. |
| `GET /attendance` | `{ records, pagination, summary, summaryScope }`; paginated sessions for Admin/Teacher, personal recorded entries for Student. Filters: `from`, `to`, `date`, `period`, `studentStatus`, `page`, `limit` (1–100). Staff additionally use academic year/class/section/teacher/assignment, record `status`, and `locked=true/false`; Student can filter `subject`. Personal ownership never comes from supplied query IDs. |
| `GET /attendance/:id` | Admin/Teacher scoped session details with a minimal recorded roster and `__v`. Admin sees audit history. Student access is denied. |
| `PATCH /attendance/:id/lock` | Admin only; body `{ version, isLocked, reason }`. Compare-and-set mutation records actor, timestamp, action and reason. |
| `GET /notices` | Up to 20 active, published, unexpired notices with public fields only. The existing notice model has no role/audience targeting. |

Timetable writes retain `/api/timetables`: POST creates; PUT edits and restores inactive bookings; DELETE deactivates. Restoration reruns eligibility and interval conflicts. Existing year-based transaction serialization and indexes remain unchanged. No draft/publish lifecycle or attendance rewrite was introduced.

**Attendance write contract:** POST `/api/attendance` creates with `{ teacherAssignment, period, attendanceDate, students }`. Every supplied student must have an explicit valid status and belong to the currently eligible roster. The existing API permits a nonempty subset; the UI starts all new roster rows Unmarked and requires explicit selection for every displayed row. `PUT /api/attendance/:id` requires `{ version: loadedRecord.__v, students }`; missing version is 428, stale version is 409. This deliberately closes the legacy stale-update gap: any other attendance client must pass its loaded version too. Assignment, date and period remain immutable. Admin corrections require a 1–500 character reason at the API and in the UI, and append an audit entry. Legacy Admin locking through PUT also requires a version and reason; locked PUTs are rejected even for Admin. Unlock only through the dedicated Admin endpoint.

DELETE `/api/attendance/:id` now requires `{ version, reason }` (Admin only). Locked or inactive sessions cannot be deleted. Deactivation is audited, retains history, and does not free the unique assignment/date/period key. There is no attendance restoration operation in the existing model/API workflow. Timetable restoration is supported separately.

Attendance summaries count all recorded statuses in the denominator and only Present in the numerator. Staff status filtering selects **sessions containing** that status; displayed summary counts cover all student entries in the matching sessions, across pages. Personal filtering matches only the caller's own entry. Empty results display no percentage; no missing record becomes an absence. No daily aggregation, weighting, automatic locking or mandatory timetable booking was added.

Enrollment limitation: Student stores only current class/section, without effective-dated enrollment. Student timetable therefore follows current placement; historical attendance comes from stored student IDs. Existing rosters retain their recorded entries, rather than adding current newcomers when editing. Corrections still validate current eligibility, so transferred/inactive/deleted students may prevent an old session from being edited. The application does not fabricate a historical enrollment relationship. Audit fields are additive; no indexes or migrations were introduced for this milestone.

The frontend uses the existing React Router package's data-router wrapper to support navigation blocking for unsaved attendance. Authentication providers and role guards remain in place. Navigation, browser unload, modal close, and logout have unsaved-change guards; session expiry still clears invalid authentication.

See [WORKFLOW_MILESTONE_REPORT.md](WORKFLOW_MILESTONE_REPORT.md) and the workflow section of [UI_ACCEPTANCE_CHECKLIST.md](UI_ACCEPTANCE_CHECKLIST.md).
