# Timetable and attendance workflow — 2026-10-09

## Screens and end-to-end workflow

- Admin timetable management: academic/year/class/section/teacher/day/status filters, weekly grid and mobile/list view, reference breaks, create/details/edit/deactivate/restore, historical labels, confirmations and conflict feedback.
- Teacher portal: protected layout/navigation, school-day lessons, weekly personal timetable, eligible classes/subjects, published notices, suggested attendance tasks labelled separately from recorded sessions, and attendance history.
- Teacher marking: select eligible assignment/date/period independently of timetable; load current roster or retrieve existing session; explicit Unmarked state and bulk Present/Clear actions; record remarks; edit unlocked sessions; read locked/inactive history. Failed saves retain entries; version conflicts require review and reload.
- Admin attendance review: paginated session filters, counts across matching sessions, roster detail, confirmed corrections, audited lock/unlock and deactivation with reasons.
- Student portal: protected dashboard/navigation, current-placement timetable, own period-wise attendance, date/subject/status filters, Present-only summaries with denominator, and public notices.

The complete workflow is API-verified using synthetic fixtures. Browser interaction and screenshots are not verified.

## Backend, security and policy

Added `/api/workflow` scoped options, timetables, roster lookup, paginated attendance/history/summary, detail, published notice, and Admin lock endpoints. Minimal projections omit financial/profile data from options and rosters. Student attendance response is explicitly shaped to exclude classmates, staff remarks, actor IDs and audit history. Legacy timetable population was narrowed to remove teacher salary/profile fields.

Attendance updates require the client's loaded `__v` as `version`, and use an atomic version predicate/increment; missing versions receive 428 and stale writes 409. This is an intentional update requirement for any legacy attendance clients. Admin lock/unlock and deactivation also compare versions and append actor/time/reason audit entries. Locked records cannot be edited through the legacy PUT route. Existing unique keys, booking transaction serialization and conflict logic remain intact. Active Student accounts are required for roster eligibility.

Preserved policy: student-period records, Present-only numerator, all five recorded statuses in denominator, no absence inferred from missing records, no daily rollups/weighting/automatic locks, and no requirement to have a timetable booking before marking an eligible assignment.

## Verification evidence

Baseline rerun before edits: frontend lint/build and 4 tests, 219 backend import checks, 7 backend regression tests and 238 isolated HTTP/integration checks all passed.

Automated results:

| Check | Result |
| --- | --- |
| Frontend lint | Passed |
| Frontend tests | 9 passed (4 academic + 5 workflow contracts) |
| Frontend production build | Passed; large-chunk warning retained |
| Backend exact-case/import checks | 222 modules passed |
| Backend regression tests | 7 passed |
| Isolated HTTP/integration checks | 313 passed, including privacy, audited correction, and concurrent edit/duplicate-create assertions |
| Git whitespace check | Passed |
| Browser workflow | Partial: Admin Attendance date-range validation was exercised read-only in the connected browser; full role workflow, viewport, keyboard and screenshot acceptance remains pending |

Verified with Node 24.10.0 and MongoDB 8.3 using fresh loopback-only test replicas. Frontend lint/tests/build also passed with the existing clean lockfile-installed dependencies in ignored `.verification/client` (Vite 8.0.13), in addition to the workspace dependency check (Vite 8.3.3). The data-router integration uses the existing React Router dependency; no package installation or lockfile change was needed.

Expanded integration coverage includes schedule create/edit/deactivate/restore, Teacher/Student ownership and malicious filters, minimal projections, explicit status validation, existing-session lookup, missing/stale version rejection, concurrent edit and duplicate-create races, lock auditing and alternate-endpoint rejection, deactivation history, personal percentages/status filters, notice publication, and inactive-account rejection. Existing academic/student/dashboard/timetable/attendance/finance/notification regressions remain included. The baseline attendance tests were updated to provide loaded versions/reasons for the strengthened write contract; their behavioral assertions were preserved.

Source-reviewed behaviors: protected route nesting, responsive grid/list switching, native dialog focus/keyboard handling, disabled mutation controls, failed-save retention, cancellation of obsolete reads, persisted filters, and unsaved-change navigation/unload/logout guards. These are not substitutes for interactive UI acceptance.

## Browser smoke check

On 2026-10-09, the connected browser opened Admin Attendance and entered a reversed school-date range. The inline validation appeared and no `/workflow/attendance` request was sent while the range was invalid. The session was logged out without making data changes. Browser version, viewport and screenshot were not recorded; this targeted check does not complete the manual acceptance checklist.

## Remaining limits

- Follow the expanded `UI_ACCEPTANCE_CHECKLIST.md`; end-to-end role interaction, desktop/mobile screenshots, keyboard operation, navigation blocking and failure-state UX remain pending.
- The current placement model has no effective-dated enrollment. Historical attendance retains recorded IDs, but corrections validate current roster eligibility; some historical sessions cannot be corrected after transfer/deactivation. No fabricated enrollment or destructive migration was added.
- Teacher reads retain the existing active-assignment access boundary; Admin can review inactive historical relationships. Attendance deactivation has no restoration API. Inactive unique session keys remain reserved.
- Student legacy `/attendance/me` reads omit staff remarks. Admin legacy attendance corrections require a reason and write an audit entry.
- Option labels and timetable grids load the filtered result set; attendance summaries currently scan matching recorded entries. Very large deployments may need further query optimization. Build chunk-size warning remains.
- Live database readiness is unverified. The local MongoDB service was configured and initialized as a single-node `rs0` replica set in a prior task; that service was not used for this milestone's automated integration tests, which used isolated replicas. No live-school-data changes were made for this milestone.
- No financial/authentication architecture changes, new dependency installs, production index changes, push or deployment were performed. Existing unrelated local changes and the prior setup script were preserved.

## Next milestone

Mock-test document uploads and learning-resource access, with calendar and notice screens completed where still missing. Complete pending browser acceptance and the documented data readiness process before rollout.
