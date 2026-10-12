# Expanded Student and Teacher management

## Implemented workflows

Admin Students and Teachers now use sectioned profile forms, matching-count statistics, exact identifier fields, general name/email search, academic filters, profile status, sorting, pagination, row selection, and Excel actions. Requests cancel when filters change. Failed saves retain input and active submissions disable dialog dismissal. Profile details show safe account fields and Teacher assignment names, with a link to Teacher Assignment management.

Student fields: full name, email, initial creation password, account status; birth date, gender, phone, address, blood group; father/mother and primary guardian names, relationship and two guardian contacts; generated admission ID, academic year (through class), class, section, roll, admission date and enrollment status. Account name/email/password, birth date, gender and placement/roll are required at creation. New guardian/contact/admission-date fields are optional to preserve existing records.

Teacher fields: account name/email/initial password/status; phone, address, optional birth date/emergency contact; generated employee ID, qualification, experience, designation, department, joining date, employment type and profile status. Name/email/password, qualification, designation and joining date are required at creation. Teachers can be onboarded without assignments. Ordinary profiles reject salary, bank, role and photograph writes. No secure image-upload workflow existed, so photograph uploads were not added.

IDs are generated server-side and immutable. Classes are tied to academic years; roll uniqueness is `(schoolClass, section, rollNumber)`, including inactive profiles. The same roll works in different sections/years. Placement changes never rewrite attendance or create historical enrollment.

## Accounts and self-service

New Student/Teacher accounts require an initial password change. The API allows only authenticated `/auth/me` and `/auth/password` during onboarding; logout remains available. Other protected APIs return `PASSWORD_CHANGE_REQUIRED`. The UI redirects to `/change-password` before loading the portal. Existing accounts and completed demo accounts are not retroactively forced through onboarding.

Passwords use the existing bcrypt save hook. The application enforces at least eight characters and at most 72 UTF-8 bytes to avoid bcrypt truncation. Creation saves one linked User/profile transactionally. Ordinary edits and update imports reject password changes. Admin has separate confirmed Reset password and Change login email dialogs. Reset metadata records actor, date and reason; reset revokes previous sessions and re-enables mandatory onboarding. Email changes record actor/date and must use the dedicated action; ordinary profile updates and import updates cannot change an existing login email.

Student and Teacher navigation includes My profile and Change password. Personal updates derive ownership solely from the authenticated User; payload IDs, roles, statuses, employment and academic placement are rejected. Students may edit phone, address, blood group and guardian contact numbers. Teachers may edit phone, address and emergency contact. Controlled fields are read-only. Self-service email changes and normal password changes require the current password.

JWTs carry a token version checked against the database on each protected request. Password changes/resets increment it and reject all older tokens, including legacy versionless tokens after the first change. Successful normal changes issue a replacement token. Logout retains the existing local-session behavior: it clears browser credentials but does not individually blacklist a copied token; such tokens expire after seven days unless revoked by a password change/reset or access deactivation.

## Excel contract

Use Import Excel on either Admin profile page. Separate templates include an Instructions sheet and an example row. The first worksheet and its exact column headings define the contract; do not use raw MongoDB IDs. Create and update are explicit modes.

Files must be `.xlsx`, at most 5 MB and 1,000 data rows. Plain text, numbers and Excel date cells are supported; formulas/rich cells, impossible dates, invalid values, unsupported columns, duplicate accounts and duplicate scoped rolls are rejected. Preview lists row number, action, identifier/name and validation errors, with create/update/error counts; it never returns credential values. Confirmation is tied to the exact file bytes, mode, Admin and a 15-minute expiry. Commit reparses/revalidates every row and returns partial-success counts honestly. Each saved User/profile pair is a separate transaction. Preview is read-only; it does not reserve email addresses or rolls.

Student updates prefer admission ID. Without one, exact academic-year/class/section names plus roll must resolve to exactly one record. Teacher updates require employee ID. Conflicting identifiers, duplicate file matches and ambiguous/missing relationships are rejected. Blank update cells preserve current values; use the form to clear optional values. Password cells must be blank for updates. Create identifier cells must be blank. Create credentials are hashed normally and require first-login change.

Export all matching uses the same backend filters/sort as the list, without pagination. Export selected uses immutable public identifiers and verifies every selection still matches the current filters. Exact-ID and scoped-roll filters apply to exports. Exports use academic names and the same column contract as templates; the password column is empty, never a stored credential. Password hashes/tokens/payroll are excluded. Formula-like text is prefixed with an apostrophe; that literal prefix is retained if re-imported. Exports contain authorized profile/contact information and are intended for Admin handling.

### Repeatable demo workbooks

The following files have passed preview validation against the existing isolated demo database; generation does not import them:

- [Student create example](demo-data/students-create-example.xlsx)
- [Student update example](demo-data/students-update-example.xlsx)
- [Teacher create example](demo-data/teachers-create-example.xlsx)
- [Teacher update example](demo-data/teachers-update-example.xlsx)

Create examples use fictional `import-students@demo.example.test` / `import-teachers@demo.example.test` accounts. Replace the template's initial password before committing. Update examples target `DVS-S001` and `DVS-T001`. To regenerate, select the dedicated demo environment in a server terminal and run `npm run seed:demo:workbooks`. Repeating a create import reports duplicates. Imports intentionally change demo counts; baseline verification may then report drift. Do not reset manually edited data unless you intend to discard it.

Fresh demo seeds now include guardian/admission fields and Teacher birth/emergency-contact fields. Completed persistent seeds still remain no-ops; no existing fixture or manual edit was overwritten.

## Compatibility and database preparation

- Transactions still require a writable MongoDB replica set. No standalone fallback bypasses atomicity.
- Existing optional fields need no destructive migration. Legacy accounts with no token version behave as version zero, and absent onboarding flags mean completed onboarding.
- The new unique Student index is `{ schoolClass: 1, section: 1, rollNumber: 1 }`. Classes already belong to one academic year. Review duplicate scoped rolls and invalid/missing references before enabling/building this index on an existing database. `npm run audit:data` includes a read-only duplicate-roll check; run it only against an intentionally selected database. This task did not run it on live data or repair/delete duplicates. The write service also serializes roster changes through Section to reject new duplicates before index installation.
- Admission and employee IDs remain unique. No existing identifiers are replaced.
- `/students/import` now uses preview/commit too. Old immediate-import callers must send mode/phase and confirmation token. `/students/sample` and `/students/export` share the new workbook contract. Download a new template; legacy column sets are rejected.
- New Admin list/import/export endpoints are `/api/people/students` and `/api/people/teachers`; existing authorized CRUD endpoints remain supported with stricter credential/identity field rules.
- No live-school database writes, push or deployment were performed. Restart an already-running API process to load these route/auth changes.

## Verification completed

- Backend module/import check: 227 modules passed; core tests: 7 passed.
- Isolated replica-set integration suite: 381 HTTP checks passed, including existing timetable, attendance, finance and academic workflows plus profile/onboarding/identity/reset/import/export cases.
- Frontend: lint passed, 17 tests passed, production build passed. The existing large-JavaScript-chunk warning remains (approximately 879 kB before gzip).
- Demo safeguards and full fresh-seed/manual-edit-preservation tests: 4 passed. An earlier attempt was interrupted by a MongoDB monitor/network timeout; a fresh isolated rerun passed all four tests.
- Existing persistent demo: 38 API checks plus structural/financial checks and repeat-seed fingerprint preservation passed. Workbook creation/validation did not commit any imported records.
- Four example workbooks generated and successfully previewed. Whitespace check passed.
- Browser inventory returned no connected browsers/apps; visual acceptance is unverified.

## Manual browser acceptance checklist (unverified)

1. Admin: open Students/Teachers, filter exact ID and name/email; combine year/class/section or employment filters, sort, page and reset. Verify totals and selections across pages.
2. Create both profile types. Confirm required-field errors, password show/hide, dependent academic resets, generated IDs and preserved input after a rejected save. Teacher creation must work before assignment allocation.
3. Log in as each new account. Only password onboarding should be available. Verify wrong-current-password and mismatched confirmation errors, complete onboarding and confirm normal portal access.
4. Review My profile on both roles. Save allowed contact fields and confirm controlled fields remain read-only. Change login email using the explicit action; confirm the previous email no longer logs in.
5. Admin edit: verify password/ID are not editable; change profile/account status and test access. Use separate login-email and reset dialogs. Verify reset revokes a second logged-in session and forces onboarding again.
6. Import each example in Preview mode; verify no rows were saved. Confirm valid create/update examples. Try duplicate rolls, missing scope, wrong dates, formula cells, unsupported headers, update passwords, altered files and expired preview tokens. Confirm partial-success summaries and no credential values in output.
7. Export all matching with a page size smaller than total; compare row count with filtered total. Select records across pages and verify the selected export. Re-import an update export with passwords blank.
8. Check existing timetable, attendance, academic setup and finance screens. Test desktop and mobile widths, keyboard navigation, dialog focus, loading/retry and blocked duplicate submissions. No browser acceptance is claimed until these steps are performed.
