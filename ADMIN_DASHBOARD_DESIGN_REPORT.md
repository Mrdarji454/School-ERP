# Admin dashboard design integration

Implemented 12 October 2026. Reference: https://crank-oats-74642599.figma.site/

## Design and scope

Inspected the existing Admin layout, routes, academic context, dashboard/workflow/resource/communication APIs and shared components first. The reference was retrieved as public HTML, CSS and JavaScript for source inspection; it was not executed or copied wholesale. No connected browser was available, so visual matching and interactive browser acceptance remain unverified.

The Admin shell now uses the reference's navy `#243e5a`, deep navy `#182c42`, restrained gold `#e8be35`, white cards and pale gray `#f5f7fa` background. Readable type sizes and 44px navigation/control targets are deliberately larger than the prototype's smallest text and buttons. Grouped navigation retains every existing destination, including separate Classes and Sections. The original `client/src/assets/vedantLogo.png` is used unchanged; the prototype icon is not used.

The dashboard contains compact Students, Teachers, Classes/Sections and Resource summary cards; attendance filters, ring and status bars; working quick actions; today's timetable preview; published notices; upcoming calendar entries; PDF resources; and scoped fee collection/recent payment summaries. It shows the authenticated name and actual Admin role, not a fictitious Super Admin role. Unsupported trends, profile-completeness claims, target percentages, unread notifications and prototype content are removed.

Existing SidebarItem/SidebarSection, Navbar, StatCard, DashboardCard, Modal, buttons, tables, inputs/selectors and RequestState are reused and improved. Admin tokens and overrides live in `client/src/styles/admin.css` under `.admin-shell`. Public school pages and Teacher/Student portals do not receive the new theme. All existing protected routes and business services remain in place. No new package, schema, API, authentication architecture or backend business feature was added.

## Real API mappings

| UI | Existing API and scope |
| --- | --- |
| Academic-year selection | `/admin-management/options` through existing session-persisted academic context; explicit selection takes precedence, otherwise the active current year is used. Missing/inactive selection requires an active year instead of fabricating statistics. |
| School greeting, date and weekday | `SCHOOL_TIMEZONE` returned by `/workflow/options`; Intl-based school clock updates every 30 seconds, including local midnight. |
| Student/Teacher/Class totals | `/dashboard/admin?academicYear=...`; uses the API's active profiles/assignment/class semantics. Section count uses eligible sections in eligible classes of that year. |
| Resource count and latest four | `/resources?academicYear=...&limit=4`; count is the API's full pagination total, explicitly labelled all publication states. |
| Attendance overview | `/workflow/attendance?academicYear=...&date=...&schoolClass=...&section=...&status=active&limit=1`; summary covers all matching recorded entries, not the one returned page. |
| Attendance choices | Eligible year/class/section labels from existing management options. Class changes clear section; year changes reset dependent dashboard state. Invalidated selections cannot widen a selected class into a stale section request. |
| Today's timetable | `/workflow/timetables?academicYear=...&day=...&status=active`, joined to eligible assignments from `/workflow/options`, active non-break periods and academic-year date bounds. First five are labelled **Preview**, with actual full eligible total. |
| Notices | `/communications/notices?status=published&limit=4`. Explicitly labelled school-wide Admin oversight, not academic-year scoped. Backend audience/publication/expiry rules remain unchanged. |
| Upcoming calendar | `/communications/calendar?academicYear=...&status=active&from=schoolDate&limit=4`; ongoing/upcoming date-only events retain existing types. |
| Fee collection / recent payments | `/dashboard/admin?academicYear=...`; fee structures/payment references establish the year scope. Amounts display only when returned `currentAcademicYear._id` matches the requested year and the total is numeric. Reversed payments are already excluded by the API. |

The dashboard's header year drives all year-scoped widgets. Notices explicitly remain school-wide. Existing management pages retain their own filters; the dashboard header selector appears on the dashboard to avoid falsely implying that unrelated page-local filters were changed. Academic management pages continue sharing the existing persisted academic context.

Attendance percentage is **Present / all recorded student-period entries**. Late, Half Day and Leave remain separate. No missing lesson/session is treated as absence; empty attendance shows no percentage. The UI does not reinterpret holidays or modify timetable/attendance policy.

Outstanding balances and salaries are omitted: limited pending-record previews and month-based salary data do not establish equivalent complete year-scoped totals. No unsupported finance management screen or payment action was introduced.

Resource types remain Mock test, Study material and Answer key; PDF is their file format. Admin resource cards preserve draft/scheduled/published/expired/archived labels. Opening files remains the existing authorized resource-library workflow, never a public storage URL.

## Navigation, states and responsiveness

- Add Student and Add Teacher link to `/admin/students?action=create` and `/admin/teachers?action=create`. PeoplePage opens the existing PersonForm, waits for real creation options, retries failed option requests, and removes the query action on close/save. Existing save handlers, validation, imports, exports and credential restrictions are unchanged.
- Attendance, resources, notices, calendar and timetable actions point to their real protected management pages. Logout retains the existing unsaved-work cancellation event.
- All dashboard fetches use the existing abortable, keyed request hook. Changed filters hide stale results and cancel superseded requests. Skeletons, empty messages, visible errors and Retry controls replace invented fallback values. Refresh reloads academic/assignment options and dashboard feeds. A workflow-options failure does not disable unrelated management forms whose own options succeeded.
- Above 1100px the sidebar is persistent and can collapse. Tablet/mobile use the existing native-dialog modal as a navigation drawer, retaining focus containment, Escape dismissal and focus restoration. Selecting a destination closes the drawer; crossing into desktop closes it. A skip-to-content link is provided.
- Dashboard grids stack at narrow widths. Tables retain their local scroll regions instead of forcing the whole layout wide. CSS constrains controls, grid children and long text. Touch targets, high-contrast focus outlines and reduced-motion overrides are included. These are source-verified behaviors, not browser-tested acceptance claims.

## Verification

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Frontend tests | 25 passed, including five new dashboard-policy tests |
| Production build | Passed; existing large-bundle warning remains (about 922 KB JS before gzip) |
| Backend imports / exact-case checks | 235 passed |
| Core tests | 7 passed |
| Isolated HTTP regression suite | 476 passed on rerun |
| Dedicated demo, read-only smoke checks | 29 passed across two academic years |
| Git whitespace check | Passed |
| Browser, visual and keyboard acceptance | Unverified: no connected browser |

The first integration attempt hit the runner's 20-second real-server startup timeout. The unchanged suite passed on rerun; no test timeout or backend code was modified to make it pass.

New frontend tests cover timezone/date/greeting boundaries, explicit/default academic years, eligible dependent choices, Present-only calculation and empty records, timetable preview totals/year bounds, and fee scope mismatch/real zero. Existing tests cover forms, dependent fields, CSV exports, publication controls and attendance contracts.

The isolated backend regression covers profile creation/update, imports, ownership, onboarding/token restrictions, academic management, timetable, attendance, resources, notices, calendar and finance behavior. The demo smoke check checked live API mappings, scoped attendance, both academic years, full timetable preview totals, resources/calendar, published notices, profile/academic lists, both XLSX exports, unauthenticated/Student rejection on Admin reads and frontend HTTP 200. These do not assert that browser clicks or forms were exercised.

The dedicated demo is running at `http://127.0.0.1:5174/admin/dashboard`, with API on 5001 and its existing synthetic database on 27018. No normal/live database was used, no demo records were reset or edited, and nothing was pushed or deployed.

## Manual acceptance checklist

Use the fictional Admin demo account and synthetic data. Browser acceptance must stay unverified until these are actually exercised:

1. Inspect 1440px desktop, 1024px tablet, 768px tablet, and 375px/320px mobile. Compare navy/gold/white hierarchy with the reference. Verify the original logo, readable text, stacked cards, card/table boundaries and no page-level horizontal scrolling. Check 200% zoom.
2. Open/collapse desktop navigation; open the mobile drawer with the keyboard, Tab/Shift+Tab through it, press Escape and verify focus returns to its trigger. Check destination closing, breakpoint closing, skip link, visible focus and reduced-motion mode. Confirm all destinations including Classes and Sections work.
3. Change academic year repeatedly and rapidly. Confirm every year-scoped card/list follows the selected year, old requests cannot overwrite new results, notices retain the school-wide label, fee scope matches, and prior-year dates do not invent lessons today.
4. Change attendance date/class/section, then class/year again. Verify dependent section reset and summary reload. Check all five statuses, Present-only percentage, empty date and unchanged denominator/no inferred absence.
5. Activate Add Student/Add Teacher. Confirm the existing form opens, creation options load, cancel/save closes it, refresh/back navigation behaves correctly, errors retain fields, and no duplicate submission occurs. Use synthetic records only. Exercise ordinary edit, Excel preview/commit/import/export and password-related navigation without changing real accounts.
6. Open timetable/attendance pages; check existing CSV export, pagination, filters, edit dialogs and lock/version conflict feedback. Open resources, notices and calendar; verify forms, publication/audience/expiry rules and private PDF previews/downloads remain intact. Recheck public pages after navigating out of Admin.
7. Block an individual dashboard API request and then options requests. Verify visible error/Retry, working independent widgets, no fake zero totals and successful recovery. Test slow responses and rapid filter changes. Expire the test session and verify the existing auth guard still redirects appropriately.
8. Compare the timetable preview count against the full eligible list and confirm it is not represented as a complete table. Verify recent payments are labelled a preview and no salary, target or completeness metrics are invented.

Remaining limits: no browser screenshots or interactive acceptance evidence; the pre-existing bundle-size warning remains; very large schools still use the existing full timetable/options read APIs before client-side preview slicing. Optimization can be considered separately if measured data volume requires it. UI assertions do not replace backend access checks.
