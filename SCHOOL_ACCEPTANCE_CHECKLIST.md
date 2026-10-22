# School-wide acceptance checklist

Use a disposable seeded environment. Never perform these acceptance edits against live school records. API and generated-document evidence is recorded in `REPORT_CARD_MILESTONE_REPORT.md`; **browser acceptance is pending because no browser was connected**.

| Workflow | Automated coverage | Required browser check |
| --- | --- | --- |
| Academic setup and people | Existing full integration suite creates years/classes/sections, Students and Teachers | Admin navigation, creation/edit dialogs, imports/exports and inline validation |
| Account onboarding/profile | Existing auth/people integration plus report download onboarding/deactivation checks | Password change gate, profile update, stale session and logout |
| Enrollment history | Existing enrollment integration and transferred report demo | Transfer/promotion preview, effective date, retained history and historical class/roll |
| Timetable/attendance | Existing scheduling/attendance integration | Overlap errors, Teacher ownership, locks, CSV and Present-only recorded-period denominator |
| Learning resources | Existing learning integration uses isolated private PDF fixtures | Upload, file errors, role/audience restrictions, download and expiry |
| Notices/calendar | Existing communication/learning integration | Targeted visibility, publication/expiry, date-only calendar values |
| Fees | Existing finance integration | Collection, receipt, duplicate retry, reversal and Student balance |
| Salaries | Existing finance integration | Teacher personal salary history and restricted Admin views |
| Assignments | Existing assignment integration | Submit, returned revision, resubmit and published evaluation |
| Exams/results | Existing exam integration | Marks validation, zero/absent/exempt, scoped correction, submit/approve/publish |
| Report cards | New issuance/download/cleanup tests and actual PDF checks | Published source/version selection, batch progress, retry, source preview, issued PDF, printing and historical versions |

## End-to-end report-card browser sequence

1. Admin selects a published exam version and captured class/section; check the candidate list contains only the selected scope. Confirm draft/submitted/approved-only exams are not selectable sources.
2. Preview one candidate's published marks. Compare zero, absent and exempt states; check no unsupported grades or totals appear.
3. Select multiple candidates, explicitly enter remarks and generate. Check per-candidate progress/outcomes. Stop after the current candidate and resume the remaining selection. Interrupted requests must be safely retryable without issuing duplicates.
4. In two Admin tabs issue the same candidate/source concurrently. Both must resolve to one retained card, with one issue number and identical download bytes. Different remarks for an already-issued source must fail visibly.
5. Preview/download the issued PDF. Verify the original school logo, A4 margins, long names, all 36 demo components, repeated table headers, totals/policy legend, remarks, issue metadata and page X of Y. Print/save from a PDF reader and inspect all pages.
6. Correct/review/publish exam marks using the existing workflow. Issue the newer source with a reason. The earlier issue must remain downloadable and visibly superseded; its bytes and historical class/roll must remain unchanged.
7. Student opens My Report Cards, filters by year/exam and downloads only their own cards. Try another Student's card ID and expect denial. Confirm a transferred Student retains personal history. Verify onboarding, deactivation and token revocation still block access.
8. In the disposable environment, simulate a network failure during generation and PDF loading. Check input retention, error text and Retry. Close/reopen preview; local blob URLs should not become public share links. Navigation while generation is active must warn/block appropriately.
9. At desktop, tablet and mobile widths, check grouped navigation, keyboard tab order, labelled checkboxes/selectors, visible focus, modal Escape/focus return, practical scrolling and no page-level horizontal overflow. Check reduced-motion preferences through the existing shell.
10. Complete every existing module row above, including uploads/downloads and failed saves, before declaring school-wide browser acceptance complete.

Record browser/version, viewport, account role, scenario, expected/actual result and evidence for each completed check. Keep all evidence synthetic. Deployment, backup-restore rehearsal, monitoring and a controlled school pilot follow this acceptance milestone.

The local synthetic recovery rehearsal is now automated in the full integration suite. See [OPERATIONS_READINESS.md](OPERATIONS_READINESS.md) for its evidence and limits, production restoration requirements, monitoring setup and pilot gates. These checks do not close the pending browser acceptance items above.
