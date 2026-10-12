# Pending Admin UI acceptance

Status: **not executed in a browser**. No connected browser was available. Run against a disposable local MongoDB replica set and synthetic accounts, using the README setup/bootstrap instructions and an explicitly configured test database. Do not use real student or teacher data. The automated integration suite creates and stops its own isolated database; it does not leave an API server running for browser testing.

## Desktop setup workflow

- [ ] Log in as Admin. Check all seven academic management destinations, Dashboard, Students, Timetable and Attendance review. No unfinished finance or logout-page links should appear; the Log out button works.
- [ ] Academic Years: create `UI 2028-2029`, dates `2028-04-01`–`2029-03-31`; reject reversed dates; edit its name. Set current, cancel once then confirm. Exactly one year shows Current; explain that this does not promote students.
- [ ] Classes: select this year, create `Class UI`; edit description. Open Details / dependencies and check counts before and after creating related records. Year remains read-only in Edit.
- [ ] Sections: choose year/class and create `A` with capacity 35. Reject zero capacity. Create another class and confirm changing the parent clears dependent fields. Editing cannot move a section; optional class teacher can be selected and cleared.
- [ ] Subjects: create `Science` / `SCI` in Class UI. Try a duplicate code, verify useful error and retained entries. Edit name/optional status. Parent class remains read-only.
- [ ] Periods: create a teaching period with an unused number, `13:00`–`14:00`; verify human-readable range. Reject reversed times and duplicate numbers. Edit the label. Using a test API-seeded scheduled period, attempt a time/break change and verify restriction feedback without schedule changes.
- [ ] Teachers: create a synthetic account with all supported contact/employment fields and an initial password. Verify generated employee ID, details, profile/account statuses and search by name/email/ID. Edit fields and clear phone. Password entry must be absent in Edit and no password/hash or payroll fields should appear in details.
- [ ] Teacher Assignments: select year → class → section/subject → teacher; only eligible matching options appear. Create a class-teacher assignment. Reject a duplicate and a second active class-teacher assignment. Edit remarks/role; all relationship fields stay read-only.
- [ ] Students: create a synthetic student using Class UI / A. Verify list/details and existing edit/import/export flows still work. Check Dashboard still renders.

## Restoration, filtering, and failures

- [ ] On each screen, deactivate a fixture, find it under Inactive, restore it, and find it under Active. Search/year/class/teacher/page-size filters persist after actions; last-page removal clamps pagination correctly.
- [ ] Deactivate a teacher; both statuses become inactive and its test login fails. Restore it; both statuses and login recover.
- [ ] Deactivate the selected year/class/subject/teacher; historical assignment/detail labels remain readable, but new selectors exclude ineligible records. Attempts to edit/restore a dependent relationship show restrictions. Restore parents first and retry.
- [ ] Deactivate the current year; Current clears. Restoring it does not silently set it current again.
- [ ] Search for nonexistent text and check the empty state; reset filters. Enter literal regex characters and check ordinary literal search behavior.
- [ ] With browser network throttling, change search/year/class quickly. Results must match the latest controls. Double-click Save/Restore: only one mutation should be sent while pending.
- [ ] Temporarily block a list/options request: error and Retry actions appear. Retry succeeds after unblocking; incomplete option loads disable new/edit actions.
- [ ] Block a save request or trigger a server duplicate error after filling a form: it stays open with all entered values, inline feedback, and an enabled retry. A failed confirmation stays open. Saving successfully closes it and refreshes the list without resetting filters.
- [ ] As Teacher and Student, directly visit all seven `/admin/...` URLs: access is denied/redirected. Verify Admin management reads and writes return 403 for these roles. Anonymous requests require login.

## Keyboard, mobile, and visual checks

- [ ] At desktop widths (1280 and 1440 px), inspect every screen for clipping, readable table headers/statuses, clear actions and usable horizontal table scrolling.
- [ ] At 390 px mobile and 768 px tablet widths, inspect every screen and form. Desktop sidebar hides on mobile; the navigation disclosure opens, selects destinations and closes. Long IDs/emails/details wrap; tables scroll inside their region.
- [ ] Use Tab/Shift+Tab only: labels focus inputs; all actions work; focus stays inside an open modal. Escape closes idle modals and returns focus to the trigger. Busy modals cannot be dismissed mid-save. Confirm and cancel are reachable.
- [ ] Check required-field/error announcements, current year, loading/empty/error messages, and visible keyboard focus. Validate the initial password field's error association.
- [ ] Inspect screenshots of the seven screens, a long form, confirmation and error states. Fix any overflow, contrast, spacing or focus defects before marking browser acceptance complete.
- [ ] Recheck Student create/edit/import/confirmation modals because the shared Modal and DataTable changed. Public Home/About/Academics/Admissions/Events/Gallery/Contact/Blog retain their existing appearance.

Record browser/version, viewport sizes, date, fixture database, pass/fail results, and screenshot paths. Do not mark unchecked items as verified.

## Timetable and attendance workflow (2026-10-09 — pending browser acceptance)

Use synthetic fixtures: one Admin, two Teachers with different class/section assignments, two Students in one class and another Student in the other class; one active academic year covering test dates; teaching and break periods; published, future and expired notices. Use a dedicated replica set/database. Automated fixture tests stop their server/database afterward; start a separate disposable development instance for this checklist.

- [ ] Admin creates a Monday timetable booking; edit room/day; inspect details. Filter year/class/section/teacher/day and compare grid/list. Period start/end, subject, teacher, room and break references are readable.
- [ ] Attempt overlapping teacher, class/section and normalized-room bookings (including different period IDs with overlapping times); errors are useful and entered values remain. An adjacent non-overlapping period is allowed.
- [ ] Deactivate and restore a booking. Inactive view retains labels; restoration checks conflicts and inactive academic references. Filters remain selected. Timetable changes do not change attendance history.
- [ ] Rapidly change filters under network throttling; no outdated results should replace the newest query. A failed request shows Retry, rather than an empty schedule. A genuinely empty schedule has a distinct empty state.
- [ ] At 1440/1280 px, inspect weekly grid columns and keyboard-accessible horizontal scrolling. At 390/768 px, verify practical list view, reference breaks, readable action buttons and no page-wide overflow.
- [ ] Teacher dashboard shows only their eligible lessons on the school date. A timetable task is labelled as inferred until an existing attendance record is found. Open it and check assignment/period/date defaults. Published notices appear; future/expired notices do not.
- [ ] Teacher weekly schedule and assignment list contain only owned relationships. Modify URL/query IDs to another Teacher's IDs; verify no schedule/roster disclosure.
- [ ] Choose an authorized assignment/date/period without a timetable booking and load the roster. School timezone and date-range restrictions are clear. No roster row is silently Present or Absent.
- [ ] Try saving with an Unmarked row: explicit validation, no request persisted. Mark all Present, check feedback, change individual rows to Absent/Late/Half Day/Leave, add a remark, and save.
- [ ] Reopen the same assignment/date/period: retrieve the existing session rather than create a duplicate. Edit unlocked rows; refresh and confirm persisted values. A concurrent duplicate creation shows an error with retained entries and a reload action.
- [ ] Open the same session in two tabs. Save in tab A, then tab B: B gets a stale-version conflict, retains its entries, and requires review/reload. Do not silently retry using the new version.
- [ ] While editing, try sidebar navigation, browser Back, Close/Escape, browser reload and logout. Unsaved changes require discard confirmation; Cancel preserves entries. While a save is pending, duplicate submissions and modal dismissal are disabled. Session expiry still invalidates authentication.
- [ ] Force a save failure by blocking the API; selected statuses/remarks remain visible, error feedback appears, and retry works when the API is available. Bulk/Clear/Cancel buttons must never submit the form accidentally.
- [ ] Teacher history filters date/status/assignment and paginates correctly; reversed date ranges show an inline error without issuing a list request. Empty records do not become Absent. Locked/inactive sessions are readable; editable controls are unavailable.
- [ ] Admin review filters year/class/section/teacher/assignment/date range/record state/lock/status. Session counts and Present counts are labelled. A “session contains status” filter counts all recorded students in those sessions, not only the selected status.
- [ ] Admin edits a session: require a correction reason and confirmation, then show audit entry after save. Lock with a reason, verify Teacher cannot edit, and verify legacy PUT cannot unlock/edit it. Admin unlocks with a reason; review actor/time/reason history.
- [ ] Admin deactivates an unlocked session with reason/confirmation. It appears in Inactive history, disappears from Student counts, and cannot be recreated with the same key. No unsupported Restore action appears for attendance.
- [ ] Student dashboard/timetable follow authenticated placement. Personal attendance lists only own date/subject/period/status; no classmates, staff remarks, actor IDs or audit fields appear in UI or response bodies.
- [ ] Record one each of Present, Absent, Late, Half Day, Leave for a Student: summary shows 1 / 5 = 20%. Add days without any record: denominator stays 5. Date/subject/status filters update matching totals across pages.
- [ ] Give a classmate an Absent entry while the Student is Present; the Student's Absent filter must not match that classmate's entry. Forged Student/Teacher IDs must not broaden personal history.
- [ ] Verify missing/inactive placement, empty schedule/history, missing references, deactivated accounts and expired login states give clear feedback without leaking other records.
- [ ] Historical sessions preserve the recorded roster. A newly enrolled Student is not silently added to an old session. Transfer/inactive-student correction restrictions are explicit; no historical placement is invented.
- [ ] Keyboard-only marking: Tab/Shift+Tab, labelled selects, arrow keys, bulk actions, save, confirmations and focus restoration. Inspect screen-reader labels/status/error announcements.
- [ ] Capture and inspect screenshots for Admin grid/list/review, Teacher dashboard/marking/history, Student dashboard/history, dirty-navigation confirmation, conflict errors and locked read-only states. Recheck Student management dialogs and all public website pages after shared router/button changes.

Browser acceptance remains pending until these items are actually exercised and findings are recorded.

## Learning resources, notices and calendar

Browser acceptance remains unverified: no connected browser was available on 10 October 2026. Follow the seven-step manual acceptance checklist in [LEARNING_COMMUNICATION_REPORT.md](LEARNING_COMMUNICATION_REPORT.md), covering upload/failure retention, keyboard/mobile layout, PDF preview/download, role isolation, scheduling, audiences, calendar scope and unchanged attendance. API/source verification does not mark these browser checks passed.
