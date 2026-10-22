# Exam management and result publication

Implemented 17 October 2026. No live school records were initialized, seeded, migrated, pushed or deployed.

## Workflows

- Admin: **Exams** navigation opens setup, schedules, captured candidate rosters, completeness review, explicit actions and actor/time/before/after history. **Published results** opens retained versions and exports.
- Teacher: **Exams** shows explicitly assigned components, entry deadlines, draft saves, submission and returned corrections. Ordinary teaching assignments never grant marks access.
- Student: **Exams** provides their captured-roster schedule; **My results** provides only their published versions, CSV and a downloadable printable HTML statement. The statement can be printed/saved as PDF in a browser and is not an official certificate or report card.
- Dashboards use `/api/exams` and `/api/exams/results`. Admin counts follow the selected academic year; schedule previews show their actual total. Teachers see entry deadlines and returned work; Students see relevant schedules and unread publications.

The normal progression is `draft → open-for-entry → submitted-for-review → approved → published`. Component states are `entry → submitted → approved`; Admin can return a submitted/approved component with a reason. Other components remain locked. Publication is a separate Admin action. A published correction requires a reason, selected components, Teacher resubmission, Admin approval and a new publication version. Archive releases exam schedule bookings while retaining publications and audit evidence.

## Eligibility and calculations

Roster capture requires an explicit eligibility date and an established Enrollment interval at that date. Snapshots retain identity, admission number, class/section, roll and enrollment evidence. Current profile placement never fabricates historical eligibility. Unknown legacy candidates require explicit exclusion with a reason, or truthful enrollment evidence followed by explicit addition. Marked candidates cannot be removed; removals retain history. Transfers do not rewrite published personal results.

Each component configures maximum marks, optional component pass marks, order, contribution and explicit evaluator accounts. Configuration locks after roster capture or active scheduling. Entry states are **Not entered**, **Scored**, **Absent**, and explicitly permitted **Exempt**. Zero is a valid score. Missing entries block submission and publication.

Policy snapshots record their version, sum/no-total aggregation, 0–2 decimal places with half-up rounding, absent handling, exemption handling and optional overall threshold/grade boundaries. Excluded entries leave both numerator and denominator; absent can instead withhold the total. Grade boundaries use rounded percentage. Component thresholds and the overall threshold are independent. No rank, GPA, promotion decision, default grade scheme or assignment-grade import is inferred.

## Consistency and permissions

- Existing authentication, token-version and role middleware remain in force.
- Exam revisions reject stale writes. Stable actor/request keys make exact marks retries safe; reusing a key with different content is rejected.
- Replica-set transactions protect writes. A shared exam-scheduling lock serializes conflict checks across exams, including different academic years. Overlapping section, normalized room or invigilator bookings are rejected; adjacent intervals are allowed.
- Normal timetable clashes are displayed as unresolved warnings. Exam operations do not change lessons or attendance.
- Immutable publication documents retain the complete approved policy/results snapshot. No API updates an old publication. During correction Students continue to see the previous published version.
- Student ownership comes from the authenticated account, including detail, list, CSV and statement routes. Teacher exports contain only assigned component work. CSV cells are quoted and formula-prefixed content is neutralized. Working reports are explicitly labelled as unpublished.
- Shared modal, table, button, selector, request-state and unsaved-navigation components are reused. Failed saves retain form input; uncertain marks retries retain the same payload/key. Reads cancel stale requests through the existing API-list hook.

## Schemas and compatibility

New collections: `Exam` (configuration, roster, entries, audit/revisions), `ExamSchedule` (sittings), `ExamPublication` (retained immutable versions), `ExamWrite` (marks retry receipts), and `ExamScheduleLock` (cross-exam scheduling mutex).

Indexes: Exam academic-year/state/date, evaluator and candidate-account lookups; schedule date/active/time and exam/component lookups; unique publication `(exam, version)` plus published owner lookup; unique write `(actor, key)`; the schedule-lock primary key. No existing schema, index or school data is migrated by this milestone. Existing deployments must provision these new model indexes using their normal release procedure before accepting concurrent writes. A writable MongoDB replica set remains required; do not bypass the existing transaction requirement.

Limits: 50 target sections, 100 components, 20 evaluators/component, 500 submitted entries/request; marks have at most two decimals. Roster, entries and audit currently live in one exam document. Large school-wide examinations with very long audit histories need separate storage/pagination work before approaching MongoDB's document size limit. This milestone does not include Excel marks import, official report-card layouts, online exam-taking or public result-verification links.

## Repeatable demo

See [EXAM_DEMO_REPORT.md](EXAM_DEMO_REPORT.md). The extension requires the completed base and enrollment demos, writes only the explicitly configured isolated demo database, and returns without writes once complete. Tests exercise it against a temporary replica set; it was not run against the user's existing school database.

## Verification

- Full isolated ERP integration suite: **859 HTTP checks passed**, including exam authorization, review/publication, scheduling/marks races, rollback, export safety and previous module regressions.
- Focused exam suite: **110 HTTP checks passed**, plus direct transaction/concurrency and immutable-publication assertions.
- Backend core/calculation suite: **12 tests passed**.
- Frontend tests: **32 passed**; lint and production build passed.
- Backend import/case validation: **258 modules passed**.
- Isolated demo suite: **4 tests passed**, including all eight exam scenarios, transferred-candidate access, corrected versions, additive reruns and preserved manual edits.
- `git diff --check`: passed. Logs are retained under `.verification/exams-*.log`.
- The existing build-size advisory remains (main JavaScript bundle about 1.04 MB before gzip); it does not fail the build.

Browser inventory returned no available browsers; **visual/browser acceptance is incomplete**. Use the manual checklist below on synthetic demo data only.

## Manual browser acceptance checklist

1. At desktop, tablet and narrow mobile widths, open Admin/Teacher/Student navigation. Check no page-level horizontal overflow; tables may scroll within their containers. Check labels, keyboard focus, modal Escape/focus return and touch targets.
2. Admin creates a two-component exam with explicit policy/evaluators, schedules it, captures the roster and resolves any unknown eligibility. Verify conflicting sittings fail and ordinary timetable warnings do not alter lessons.
3. Teacher opens their component, enters zero/absent/exempt/missing examples, saves and reloads. Missing entries must block submission. An unrelated Teacher must not see the component.
4. Interrupt a marks save using browser network controls. Confirm inputs remain and uncertain retry sends the same attempt. In two tabs, save competing revisions; the stale tab must show a conflict and retain its input. Test navigation, logout and reload warnings for unsaved work.
5. Submit both components. Admin returns one with a reason. Confirm the other remains locked. Correct/resubmit, approve, then separately publish. Before publication, verify Student result pages/exports remain empty or denied.
6. Student views only their own published result, marks it read, selects previous versions and downloads CSV/statement. Open the HTML statement locally and print/save PDF. Check labels and page breaks. Attempt another candidate ID and expect denial.
7. Begin an audited correction, verify the old result stays visible, resubmit/approve/publish, and compare both versions. Verify the transferred demo candidate retains the captured class/section and personal result access.
8. Exercise academic-year/section filters and every CSV. Check zero versus blank, formula-safe names, full filtered scope and explicit working/published labels. Test loading, empty results, API failure and Retry.
9. Recheck existing people forms/imports/exports, enrollment, timetable, attendance, PDF resources, assignments, notices, calendar, finance and public school pages.

Next milestone: **report-card design and school-wide browser acceptance**.
