# Finance management milestone

Implemented against the existing FeeStructure, StudentFee, FeePayment, SalaryStructure, TeacherSalary and SalaryPayment models. Enrollment/transfers/promotion, the navy/gold Admin shell, public pages and unrelated local changes were verified in code and preserved. No live-school data or existing demo database was changed. Nothing was pushed or deployed.

## Screens and navigation

| Role | Destination | Capabilities |
| --- | --- | --- |
| Admin | `/admin/fees` | Balances, payment collection, history, receipts, reversals, filtered totals and XLSX reports |
| Admin | `/admin/fee-structures` | Create, edit unissued structures, deactivate for future use |
| Admin | `/admin/fee-issuance` | Eligible students, per-student preview, conflict/duplicate results, confirmation, safe partial retry |
| Admin | `/admin/salaries` | Salary periods, earnings/deduction/net amounts, partial payments, history, reversals, statements and reports |
| Admin | `/admin/salary-structures` | Create, edit unissued salary structures, deactivate for future use |
| Admin | `/admin/salary-issuance` | Confirm teacher/month/year generation; retry returns the existing period |
| Student | `/student/fees` | Own obligations, known due dates, paid/outstanding amounts, own receipts/statements and exports |
| Teacher | `/teacher/salary` | Own salary periods, supported earnings/deductions, paid/outstanding amounts, own statements/payment acknowledgments |

Finance links were added to the existing role navigation and Admin dashboard. Shared dialogs, buttons, tables, selectors, pagination and request states are reused. Filtered reads cancel stale requests. Failed confirmations remain open and retain input. Lists retain filters when refreshed after mutations. Wide tables scroll within their container.

## Existing rules reused and narrow API additions

Payments still use `recordPayment` and `reversePayment` in `paymentService.js`. Positive amounts are validated as integer minor units; fractions down to 0.01 are supported. Transactions atomically update the obligation and create/reverse a payment. Concurrent overpayments fail. Duplicate nonempty external references remain unique per payment kind.

Payment idempotency now compares obligation, normalized amount, method, reference, remarks and recording Admin. The same key/input returns the original record, including when it has subsequently been reversed. Different input with the same key fails. An external-reference collision explicitly reports that this attempt rolled back.

The browser generates one key per logical payment, blocks repeated submissions, and saves the attempted payload/key in tab session storage scoped to the Admin, payment kind and obligation. A network/server failure retains the exact attempted details for retry, including after reopening/reloading the same tab. A pending attempt can be resumed even when the balance was fully paid. Confirmed validation/overpayment/reference-collision failures allow correction. Closing the entire tab loses that tab's retry state: inspect server payment history before collecting again. No password or token is stored in this draft.

New `/api/finance` endpoints provide safe, explicitly projected views over the same models:

- `GET /:kind` — paginated balances or payments, totals, scope text and school timezone (`kind=fee|salary`).
- `GET /:kind/export` — all authorized matching rows as XLSX, independent of the displayed page, with a Scope sheet.
- `GET /:kind/receipts/:id` and `/statements/:id` — downloadable printable HTML documents.
- Admin `GET /fee/candidates`, `POST /fee/preview`, `POST /fee/assign` — enrollment-aware fee assignment with signed, actor-bound, 15-minute previews.

Existing payment, reversal, structure, fee-assignment and salary-generation URLs remain supported. Fee assignment and salary generation now share transactional issuance services. Existing StudentFee amount adjustments remain limited by the earlier rule: no amount adjustment once any payment history exists. This milestone does not add an adjustment UI or weaken that restriction.

## Assignment, historical amounts and enrollment

Fee uniqueness remains **student + feeStructure**, including inactive obligations. Assignment retries return the existing obligation; they do not reactivate it or create another. A batch supports 1–100 students with per-row atomicity and explicit partial outcomes. Structure changes, enrollment changes and eligibility are checked again at commit. Duplicate obligations are shown in preview.

Eligible fee candidates need an active Student account/profile and established Enrollment in the fee's academic year. Assignment uses the latest established placement within that year, including a historical interval; it does not claim the student is enrolled today. This supports explicit historical billing while preserving transfers. Legacy students with no established enrollment are excluded until the enrollment milestone's reviewed initialization process is completed. Promotion never calls fee assignment.

New StudentFee records snapshot academic year, class/section, fee description and the source due date. Total/paid/outstanding amounts remain on the original obligation. New TeacherSalary records snapshot basic salary, allowance and description alongside the existing gross, deduction and net values. Salary uniqueness remains **teacher + month + year**, including inactive records. Generation uses the applicable active structure effective by the end of that month, without proration, statutory payroll, tax/PF rules or automatic deductions.

**Issued structures are immutable through update APIs.** An Admin must deactivate the structure and create a replacement for future obligations. Deactivation leaves existing obligations and payment history intact. Existing active uniqueness rules still apply: one active fee structure per year/type/semester and one active salary structure per teacher. A replacement fee structure is a different obligation source; explicitly assigning both versions creates two separate obligations, so do not use replacement assignment as a way to revise an already-issued fee.

Historical StudentFee records retain their stored totals. Missing due dates and placement snapshots remain unknown; a currently edited source structure is not used to invent their original due dates/descriptions/classes. The original fee-structure academic-year relationship is used as the legacy year fallback because the existing API does not move that relationship. Historical salary basic/allowance components are shown as not snapshotted when missing; recorded gross/deduction/net amounts remain authoritative.

## Receipts and reversals

New payments receive backend-generated `F-<UUID>` / `S-<UUID>` receipt identifiers. Sparse unique indexes enforce uniqueness within each payment collection. New identifiers are assigned only on new-record validation, so loading or reversing an older payment does not invent a historical receipt number.

An older payment without a number gets a stable read-time `F-LEGACY-<digest>` or `S-LEGACY-<digest>` document identifier, derived from its immutable record identity. It is explicitly marked legacy and never backfilled into live records. It remains stable after reversal and exposes no raw database identifier.

Documents include school name (optional `SCHOOL_NAME`, default **Vedant Vidhya Sankul**), permanent admission/employee ID, person name, original obligation/year or salary period, amounts, recorded method/reference, staff label, school-local timestamp and reversal actor/time/reason. All interpolated text is HTML-escaped. Documents contain no account passwords, token values, private bank details or internal database IDs.

The download is **standalone printable HTML** using existing browser facilities, not a generated PDF attachment. Open it and use browser Print / Save as PDF. Receipts clearly distinguish a recorded collection from gateway verification and a reversal from a bank refund. An old downloaded copy cannot update itself; re-download after a reversal. Statements show current balances at download time.

Reversal remains Admin-only, requires confirmation and a reason, preserves the original payment, and cannot reduce paid totals twice. Reversed payments are visibly marked and excluded from collection totals.

## Ownership, filters and report reconciliation

Personal ownership comes from the authenticated account, never a submitted student/teacher ID. Forged personal filters cannot widen scope. Foreign statements/receipts return 404; the wrong finance role returns 403. Onboarding restrictions and token-version checks remain enforced by existing middleware. Academic/profile/resource responses were not expanded with payroll fields.

Fee filters include obligation academic year, class/section **at assignment**, person name/permanent identifier and obligation status. Unknown legacy placements do not match class/section filters. Salary filters use payroll month/year and person/status; they do not pretend to have an academic-year scope.

Payment date filters use inclusive **school calendar dates** in `SCHOOL_TIMEZONE`, default Asia/Kolkata. They filter payments, not the original obligation balances. The UI explicitly distinguishes:

- All-time outstanding and paid amounts on matching obligations, including inactive obligations.
- Non-reversed payments within the selected payment-date/reversal filters.
- Reversed payment amounts within those filters.

Unknown due dates are never called overdue. XLSX exports use the same server filters across all rows, protect spreadsheet formula-like values, include reversal status and state UTC timestamp/timezone explicitly. The Admin dashboard still sums non-reversed collections against fee structures in its selected academic year; tests reconcile this with the finance report.

## Compatibility and rollout requirements

No destructive migration or automatic historical snapshot backfill is provided or required. New fields are optional for old records. Existing balance/period/idempotency/external-reference indexes remain intact. New `receiptNumber` sparse unique indexes are additive. Normal application database initialization builds model indexes before accepting requests; a rollout must check any existing nonempty receipt identifiers for duplicates before enabling those indexes. Do not drop an index or overwrite records to bypass a conflict.

All issuance/payment workflows require the existing writable MongoDB replica-set configuration. Review existing balance/payment reconciliation on a copy before rollout. Enrollment initialization/index requirements remain in `ENROLLMENT_MILESTONE_REPORT.md`; this milestone does not initialize live enrollment history. Validate old unknown-date records and any previously edited structures explicitly instead of assuming new snapshot fields can reconstruct them.

Finance list/export totals are computed from authorized projected records on the server. They currently load the matching finance dataset in memory, so very large ledgers will need database aggregation/streaming before scale-up. Reads are not a point-in-time accounting snapshot during concurrent writes; refresh after confirmed mutations and run final exports when collection edits are idle. Existing payment/obligation write transactions remain atomic.

## Additive demo extension and scenarios

`extend-finance.js` uses the exact guarded `school_erp_demo` database and a completed seed. It never resets existing data. It requires established demo enrollment, refuses unmanaged fixture/period collisions, uses deterministic owned obligation IDs and stable payment keys, and records completion in a manifest. Completed reruns perform no writes and preserve manual edits. It leaves the original seed and enrollment/learning extensions intact.

```powershell
$env:DEMO_MONGODB_URI = 'mongodb://127.0.0.1:27018/school_erp_demo?replicaSet=demoRs'
npm run seed:demo:finance --prefix server
npm run seed:demo:finance:verify --prefix server
npm run seed:demo:verify --prefix server
```

An older demo with unresolved enrollment must first undergo the explicitly reviewed enrollment initialization on that demo database. Do not reset a manually edited demo just to enable the extension.

| Existing fictional account | Added example |
| --- | --- |
| student1@demo.example.test | Pending fee of 1,000 |
| student2@demo.example.test | Fee of 1,000, paid 250, outstanding 750 |
| student3@demo.example.test | Fee of 1,000, fully paid |
| student4@demo.example.test | Payment of 200 reversed; original payment retained |
| student5@demo.example.test | Explicit synthetic legacy obligation with unknown due date |
| teacher1@demo.example.test | Added salary period, partially paid |
| teacher2@demo.example.test | Added salary period, fully paid |
| teacher3@demo.example.test | Added salary payment reversed, balance restored |

The added salary period is April 2026, or May if the original seed already used April. Existing demo credentials remain unchanged. Extension totals: **5 fee obligations, 3 fee payments, 3 salary periods and 3 salary payments**. Non-reversed added fee collections reconcile to **1,250**. These tools were exercised only on isolated synthetic databases during implementation.

## Verification

- Frontend lint passes; **27 frontend tests** pass; production build passes (existing large-bundle advisory remains).
- Backend exact-case/import checks pass for **244 modules**; **7 core tests** pass.
- **633 HTTP/integration checks** pass, including fee preview/assignment/retry, stale previews, failure rollback, overpayment concurrency, changed idempotency details, receipt uniqueness/XSS/ownership, legacy receipt stability across reversal, school-date boundaries, salary generation/payment/reversal, personal isolation, dashboard/XLSX reconciliation and preserved fee placement after transfer.
- **4 demo tests** pass with no skips, including full synthetic seeding, all extensions, reconciliation and fingerprint checks proving completed reruns preserve manual edits.
- `git diff --check` passes under repository settings; CRLF conversion notices are informational.

Commands: `npm run lint --prefix client`, `npm test --prefix client`, `npm run build --prefix client`, `npm run check:imports --prefix server`, `npm test --prefix server`, `npm run test:integration --prefix server`, `npm run test:demo --prefix server`, `git diff --check`. Database tests use `TEST_MONGOD=C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe`, random loopback ports and isolated disposable replica sets, never the school URI.

## Manual acceptance: browser verification incomplete

Browser inventory returned no connected apps/browsers. Visual layout, native printing and desktop/mobile keyboard interactions are **unverified**. On a disposable test database:

1. Check Admin Finance navigation, fee/salary structures, forms, mobile table scrolling, drawer navigation, focus, Escape and labeled controls.
2. Select a fee structure and students. Preview duplicate/conflict rows, cancel, then confirm. Retry; confirm no duplicate obligations and accurate partial outcomes.
3. Record a partial payment. Verify input survives failures, double clicks submit once, and an uncertain network outcome can resume with the same payload/key after reopening. Check history before beginning any different collection.
4. Download/open/print its receipt and save as PDF. Confirm school, person/year/description, amount/method/reference/staff, timezone and line wrapping.
5. Sign in as the Student and verify own balances/payment/receipt. Try another Student's document URL; access must fail.
6. Admin reverses with a reason. Fail one request deliberately, ensure confirmation stays open, then retry. The original receipt is marked reversed; totals and outstanding balances reconcile. Repeated reversal changes nothing twice.
7. Generate a Teacher salary period, record a partial salary payment, and confirm the Teacher's own statement/payment acknowledgment. Check another Teacher cannot retrieve it. Verify salary reversal and safe generation retry.
8. Change academic-year/person/status/payment-date/reversal filters. Export from a later page and compare every matching row and scope totals. Confirm unknown due dates are never shown as overdue.
9. Recheck enrollment transfer/promotion, historical attendance, resources/notices/calendar, profile/import/export and dashboard. Financial obligations must stay linked to their original records after a transfer.

Next milestone: **assignments, submissions and teacher evaluation**.
