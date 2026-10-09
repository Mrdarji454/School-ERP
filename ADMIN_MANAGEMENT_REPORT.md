# Admin management milestone — 2026-10-08

## Completed screens and workflows

Academic Years, Classes, Sections, Subjects, Periods, Teachers, and Teacher Assignments have protected Admin routes, lists, search/status filters, server pagination, detail views, create/edit forms, confirmation dialogs, and supported deactivation/restoration actions. Years support current-year selection; class details show dependency counts. Academic filters are shared across year-scoped screens. Periods display readable times and explain scheduling restrictions.

Teacher profiles include backend-generated employee IDs, contact and employment fields, and linked account/profile status. Initial password entry is a separate creation-only section. Edit payloads exclude passwords, salary, and other payroll fields. Assignments use eligible dependent options and preserve immutable historical relationships, with class-teacher status and remarks editable.

Shared tables handle loading/empty states. Native dialog modals provide keyboard containment, Escape handling, labelled headings, and focus restoration; mutation controls are disabled while saving. Failed requests leave forms/confirmation dialogs open with errors. List and option requests cancel stale work; list filters persist after mutations. Responsive navigation exposes only implemented destinations. These UI behaviors were reviewed in source; interactive acceptance is still pending.

## Material backend changes

- Added Admin-only paginated/filterable management reads, minimal historical option labels with eligibility, and class dependency counts. Existing resource write APIs and legacy reads remain in use.
- Section creation now persists the supported optional class teacher; editing can clear it with `null`.
- Teacher validation covers supported phone and employment fields, including clearing an optional phone number.
- Duplicate-key errors give safe, actionable messages for email, subject code, period number, assignment, and class-teacher collisions. Existing sequential precheck responses retain their original status codes.
- No new dependencies, models, indexes, authentication architecture, attendance policy, financial rules, or live-data modifications.

## Verification

The repaired baseline was rerun before implementation: frontend lint, 216 backend import checks, 7 regression tests, and 141 isolated integration checks passed.

Final results:

| Check | Result |
| --- | --- |
| Frontend `npm run lint` | Passed |
| Frontend `npm test` | 4 management contract tests passed |
| Frontend `npm run build` | Passed; large-chunk warning remains |
| Backend `npm run check:imports` | 219 modules and exact-case imports passed |
| Backend `npm test` | 7 regression tests passed |
| Backend `npm run test:integration` | 238 HTTP/integration checks passed |
| `git diff --check` | Passed |
| Browser / screenshots / live school data | Unverified |

Environment: Node 24.10.0 and local MongoDB 8.3. Frontend lint/tests/build passed both in the workspace (Vite 8.3.3) and with the existing clean lockfile-installed dependencies in ignored `.verification/client` (Vite 8.0.13), refreshed with the finished source. No dependency or lockfile changes were needed for this milestone; `client/package.json` only adds the test command.

The integration suite starts its own loopback MongoDB replica set with synthetic fixtures and never reads the school's `.env` or database URI. Its expanded workflow covers setup, edits, current-year changes, deactivation/restoration, minimal dropdown projections, filtering/pagination, duplicate errors, and student creation using newly managed class/section records. Previous dashboard, student, timetable, attendance, account rollback, concurrent payment/scheduling, and finance checks remain included. Early test runs exposed mismatched test expectations for existing 400 duplicate responses; these were corrected without changing the API contract. Optional blank-phone validation was fixed and covered before the final passing run.

Frontend tests cover date/time constraints, creation-only teacher credentials, payroll exclusion, dependent option eligibility/resetting, and historical relationship payloads. Admin route protection is confirmed by source inspection; role restrictions for management APIs are exercised over HTTP.

## Limitations and handoff

- No browser is connected (`apps: [], browsers: []`), so no desktop/mobile screenshot review or interactive UI acceptance is claimed. Follow [UI_ACCEPTANCE_CHECKLIST.md](UI_ACCEPTANCE_CHECKLIST.md), particularly keyboard focus, failed-save retention, rapid filter changes, and shared Student modals.
- Existing live-data readiness remains unverified. Retain the documented backup/audit/index-readiness process before using an existing school database.
- The production build retains its large JavaScript chunk warning. The option endpoint returns complete minimal labels; unusually large schools may eventually need searched option endpoints.
- No push, deployment, or live-data changes were performed. Existing unrelated local changes were preserved.
- Next milestone: timetable management and the teacher attendance workflow.
