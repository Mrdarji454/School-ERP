# Academic management UI — 22 October 2026

Implemented the six academic modules from the existing Figma file:
https://www.figma.com/design/sFK7BMjiuQwtSSB9vNjXQN/Shramsetu?node-id=43-2829

## Changes

Academic Years, Classes, Sections, Subjects, Periods and Teacher Assignments now share the approved white sidebar, navy/gold active navigation, original logo, locally bundled Inter font, breadcrumb, page heading, context card, filter panel, desktop table and mobile record cards. Teacher Assignments is grouped under Academics. Other Admin screens retain their existing visual theme.

Creation and editing use a full-page, responsive form in the existing protected route. Required fields are marked, relationship labels remain available for historical records, requests disable mutation controls while saving, and failed saves retain input. Existing details, class dependencies, current-year confirmation, deactivation and restoration remain connected to real services. Mobile filters expand independently of search. Both presentations share record values and actions. Search/filter changes retain the existing cancellation of obsolete requests and reset pagination; changing class or year clears dependent section/subject filters.

Small additive changes to Admin-only management reads supply:

- Class section totals and active Student profile counts, aggregated only for the returned page.
- `isScheduled` for periods, including inactive timetable history.
- `hasEnrollments` for academic years, including historical enrollments.
- A validated exact subject filter for teacher assignments.

These reads contain no new contact, credential or payroll data. Existing write endpoints remain authoritative if dependencies change after the UI loads. Scheduled time/break controls, year boundaries with enrollments, and immutable academic relationships are read-only in edit forms.

## Deliberate adaptations

Figma examples are replaced with actual records, counts, current-year selection and the user's account/school clock. Existing navigation destinations and collapse/logout controls remain functional. Forms follow supported fields: status uses confirmed list actions, rather than an unsupported status write from a dropdown. Details and confirmations reuse existing accessible native dialogs. Mobile cards retain all available record actions, including deactivation. No demo records are added to the application.

## Verification

- Frontend lint, 35 tests, and production build passed using `npm ci` lockfile dependencies.
- Backend exact-case import check: 262 modules passed. Backend unit/regression tests: 12 passed.
- Full isolated MongoDB integration suite: 921 HTTP/integration checks passed, including new metadata/filter assertions and existing academic, enrollment, timetable, attendance, finance, learning, exam, report-card and recovery checks.
- Headless Chrome 151.0.7922.34: 66 assertions passed, with 18 desktop/mobile/edit screenshots captured. Representative screenshots were visually reviewed. Checks cover all six modules, page overflow, original-logo loading and 56×64 geometry, edit restrictions, mobile filters/cards, date validation without a mutation request, failed-save retention, failed confirmation retention, Escape/focus restoration, failed-list retry and obsolete-request cancellation. No page JavaScript errors were observed.
- `git diff --check` passed. Existing large JavaScript chunk warning remains.

Browser acceptance used synthetic intercepted API responses. This verifies client interaction separately from the actual API suite; it is not a combined browser-to-database test or live-school acceptance. The tests did not read a school `.env` or use a live database. Integration used a fresh loopback replica set with synthetic records. Node 24.19.0 and MongoDB 8.0.16 were used. This runtime required the test MongoDB process to use `--nounixsocket`; existing pinned report-card Python requirements were installed in an ignored test environment. No application security or database policy was weakened.

## Reproduce

```sh
npm --prefix client ci --ignore-scripts
npm --prefix client run lint
npm --prefix client test
npm --prefix client run build
npm --prefix server ci --ignore-scripts
npm --prefix server run check:imports
npm --prefix server test
# Install existing server/scripts/report-card-requirements.txt in the documented Python environment first.
TEST_MONGOD=/absolute/path/to/mongod npm --prefix server run test:integration
```

The optional `client/tests/academic.browser.mjs` runner needs an externally available Playwright installation and Chromium. It starts a temporary Vite server, intercepts all API calls with synthetic fixtures, and writes screenshots to ignored `.verification/academic/`. Run from any directory; it resolves the project root itself:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
BROWSER_EXECUTABLE_PATH=/absolute/path/to/chromium \
node client/tests/academic.browser.mjs
```

Without these variables, it uses a normally resolvable `playwright` package and its default installed browser. Playwright is not added to the application dependencies. No package/lockfile changes, migrations, production indexes, deployment or live-school-data writes are part of this change.
