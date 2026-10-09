# Timetable and attendance workflow plan

1. [x] Verify baseline and inspect authorization, academic eligibility, school dates, and existing UI contracts.
2. [x] Add minimal scoped workflow reads, attendance client-version checks, and audited Admin lock/unlock without changing attendance percentages or booking rules.
3. [x] Build Admin timetable/review screens, Teacher dashboard/schedule/attendance, and Student dashboard/personal history using shared components.
4. [x] Verify the complete workflow, privacy, stale/concurrent writes, locks, and previous regressions in an isolated replica set; run lint/tests/build/import/whitespace checks.
5. [x] Update API/policy handoff and specific browser acceptance checklist; distinguish interactive checks from source/API checks. No browser is connected, so interactive acceptance remains pending.

No live school data, production indexes, financial rules, deployment or pushes will be changed. Existing MongoDB setup work is preserved; this milestone does not continue deployment configuration.
