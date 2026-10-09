# Pending Admin UI acceptance

Status: **not executed in a browser**. No connected browser was available. Run against a disposable local MongoDB replica set and synthetic accounts, using the README setup/bootstrap instructions and an explicitly configured test database. Do not use real student or teacher data. The automated integration suite creates and stops its own isolated database; it does not leave an API server running for browser testing.

## Desktop setup workflow

- [ ] Log in as Admin. Check all seven navigation destinations, Dashboard and Students. No unfinished timetable, attendance, finance, or logout-page links should appear; the Log out button works.
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
