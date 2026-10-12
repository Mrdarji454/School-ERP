# Demo Vidya School — reusable dummy-data report

> Every person, address, contact and financial record in this report is fictional. Use only for local development. Real application branding is unchanged.

Seed school date: **2026-10-09**. Timezone: **Asia/Kolkata**. Reproducible random seed: **vidya-2026-v1**.
Attendance window: **2026-09-22 through 2026-10-08**, 15 completed Monday–Saturday working days. All lessons on the seed date are initially unmarked.

## Login accounts

Development-only password for all seeded accounts: **DemoSchool123!**. Never use it for the real school.

| Account | Use |
| --- | --- |
| admin@demo.example.test | All Admin screens, setup, timetable and attendance review |
| teacher1@demo.example.test | Class 6 A English, Class 10 B Mathematics, Class 10 A Science |
| teacher2@demo.example.test | Class 6 B English, Class 6 A Mathematics, Class 10 B Science |
| student1@demo.example.test | Class 6 A, roll 1; high-attendance profile |
| student2@demo.example.test | Class 6 B, roll 1; medium-attendance profile |
| student3@demo.example.test | Class 7 A, roll 1; low-attendance profile |
| student249@demo.example.test | Inactive: Class 10 A, roll 25; login must fail |
| student250@demo.example.test | Inactive: Class 10 B, roll 25; login must fail |

## Generated counts

| Model | Count |
| --- | ---: |
| User | 271 |
| Student | 250 |
| Teacher | 20 |
| AcademicYear | 2 |
| SchoolClass | 5 |
| Section | 10 |
| Subject | 30 |
| TeacherAssignment | 60 |
| Period | 6 |
| Timetable | 300 |
| Attendance | 684 |
| AcademicCalendar | 5 |
| Notification | 5 |
| FeeStructure | 1 |
| StudentFee | 248 |
| FeePayment | 11 |
| SalaryStructure | 20 |
| TeacherSalary | 20 |
| SalaryPayment | 5 |

250 Student profiles include 248 active and 2 inactive profiles/accounts. Every section has 25 profiles; Class 10 A/B each have 24 currently eligible roster members. All 20 teachers and the main demo accounts are active. Only active students receive fee assignments and attendance entries.

## Timetable reference

Monday–Saturday: 09:00–09:45, 09:45–10:30, break 10:30–10:50, 10:50–11:35, 11:35–12:20, 12:20–13:05. Every section has five lessons per working day, 30 per week. Rooms are DVS-6A through DVS-10B. Sunday has no lessons; no fake Sunday task is generated.

| Day | Period 1 | Period 2 | Period 3 | Period 4 | Period 5 |
| --- | --- | --- | --- | --- | --- |
| Monday | English | Mathematics | Science | Social Science | Hindi |
| Tuesday | Mathematics | Science | Social Science | Hindi | Computer Studies |
| Wednesday | Science | Social Science | Hindi | Computer Studies | English |
| Thursday | Social Science | Hindi | Computer Studies | English | Mathematics |
| Friday | Hindi | Computer Studies | English | Mathematics | Science |
| Saturday | Computer Studies | English | Mathematics | Science | Social Science |

## Section and teacher assignments

| Section | Class teacher / English | Mathematics | Science | Social Science | Hindi | Computer Studies |
| --- | --- | --- | --- | --- | --- | --- |
| Class 6 A | teacher1 | teacher2 | teacher3 | teacher14 | teacher15 | teacher16 |
| Class 6 B | teacher2 | teacher3 | teacher4 | teacher15 | teacher16 | teacher17 |
| Class 7 A | teacher3 | teacher4 | teacher5 | teacher16 | teacher17 | teacher18 |
| Class 7 B | teacher4 | teacher5 | teacher6 | teacher17 | teacher18 | teacher19 |
| Class 8 A | teacher5 | teacher6 | teacher7 | teacher18 | teacher19 | teacher20 |
| Class 8 B | teacher6 | teacher7 | teacher8 | teacher19 | teacher20 | teacher11 |
| Class 9 A | teacher7 | teacher8 | teacher9 | teacher20 | teacher11 | teacher12 |
| Class 9 B | teacher8 | teacher9 | teacher10 | teacher11 | teacher12 | teacher13 |
| Class 10 A | teacher9 | teacher10 | teacher1 | teacher12 | teacher13 | teacher14 |
| Class 10 B | teacher10 | teacher1 | teacher2 | teacher13 | teacher14 | teacher15 |

## Attendance test cases

| Scenario | School date | Class / section | Subject | Period | Owning teacher |
| --- | --- | --- | --- | --- | --- |
| Locked | 2026-09-22 | Class 6 B | Mathematics | Period 1 09:00–09:45 | teacher3@demo.example.test |
| Teacher 1 unlocked | 2026-09-22 | Class 10 B | Mathematics | Period 1 09:00–09:45 | teacher1@demo.example.test |
| Deactivated | 2026-09-22 | Class 8 A | Mathematics | Period 1 09:00–09:45 | teacher6@demo.example.test |

Use these dates and assignments in Attendance history filters. The IDs below also work in the demo frontend URL `/admin/attendance?record=ID` (Admin) or `/teacher/attendance?record=ID` (owning Teacher only).

- Locked session ID: 02d35e501f07a373f0161415. Admin can unlock with a reason; Teacher edits must fail while locked.
- Teacher 1 unlocked session ID: 555d64db5fa988fd4a5b8a23. Open Teacher history and edit this session; concurrent/stale saves must fail with 409.
- Deactivated session ID: 0b200f8fa7fcd9d486fd4a5b. Find it using Admin Inactive filter. No attendance restore operation exists; its unique key stays reserved.
- 66 completed timetable sessions are intentionally missing. They are not Absent and are not included in any percentage denominator.
- For a fresh marking test, Teacher 1 opens a task on the seed date, or chooses their Class 6 A English assignment and an eligible teaching period on that date. Student 1 should then see their recorded entry. Student 2 must not see Student 1’s status.
- Bulk actions start from Unmarked. Only Present contributes to the numerator; all five recorded statuses count in the denominator.
- Existing attendance retains the original roster. No prior-year enrollment is fabricated; prior year contains setup/calendar only.

| Status | Active recorded student-period entries |
| --- | ---: |
| present | 14732 |
| absent | 1062 |
| late | 478 |
| halfDay | 327 |
| leave | 288 |
| total | 16887 |

### Personal percentage checks

Fresh-seed totals across all active history. Clear date/subject/status filters to compare. Legitimate manual marking will change these numbers.

| Login | Present | Recorded periods | Present-only percentage |
| --- | ---: | ---: | ---: |
| student1@demo.example.test | 61 | 69 | 88.41% |
| student2@demo.example.test | 58 | 70 | 82.86% |
| student3@demo.example.test | 35 | 67 | 52.24% |

## Finance exercises

- Student 1: annual fee fully paid; Student 2: partially paid; Student 3: pending; Student 4: payment reversed, balance pending again.
- Teacher 1: salary fully paid; Teacher 2: partially paid; Teacher 3: pending; Teacher 4: salary payment reversed.
- Payments are fictional Cash entries with deterministic idempotency keys. No bank/card credentials or payment gateway are involved.

| Ledger | Net paid | Outstanding | Pending | Partial | Paid | Reversed payments |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| fee | 80000 | 2896000 | 238 | 5 | 5 | 1 |
| salary | 84000 | 631000 | 16 | 2 | 2 | 1 |

## Verification and future reuse

Last API verification: **2026-10-10T09:26:03.507Z** (UTC). Seed date remains **2026-10-09**; verification does not reseed or change it.

38 demo API checks passed. Timetable interval conflicts: 0. Foreign references, role isolation, roster eligibility, locked updates, duplicate rejection, personal percentages, notice visibility and payment/reversal balances passed. Repeated seed preserved all stored documents: true.
Browser acceptance: **unverified**. Follow DEMO_DATA_GUIDE.md for startup and manual UI checks. A normal seed rerun is a no-op after completion; it does not refresh dates, reset passwords or overwrite manual testing. Explicit reset is the only rebuild path.
This is a snapshot at seed verification. Today’s tasks use the actual school date, and future/expired notices naturally change visibility over time. Reset with a current seed date for a fresh current-day demo, or use the recorded dates in filters.

## Teacher directory

| Employee ID | Fictional name | Login |
| --- | --- | --- |
| DVS-T001 | Aarav Bhat | teacher1@demo.example.test |
| DVS-T002 | Rehan Joshi | teacher2@demo.example.test |
| DVS-T003 | Neel Iyer | teacher3@demo.example.test |
| DVS-T004 | Mira Nair | teacher4@demo.example.test |
| DVS-T005 | Yash Verma | teacher5@demo.example.test |
| DVS-T006 | Neel Verma | teacher6@demo.example.test |
| DVS-T007 | Dev Pillai | teacher7@demo.example.test |
| DVS-T008 | Tara Kulkarni | teacher8@demo.example.test |
| DVS-T009 | Diya Rao | teacher9@demo.example.test |
| DVS-T010 | Kavya Sethi | teacher10@demo.example.test |
| DVS-T011 | Diya Shah | teacher11@demo.example.test |
| DVS-T012 | Kabir Shah | teacher12@demo.example.test |
| DVS-T013 | Diya Kulkarni | teacher13@demo.example.test |
| DVS-T014 | Sana Patel | teacher14@demo.example.test |
| DVS-T015 | Kiran Bose | teacher15@demo.example.test |
| DVS-T016 | Tara Nair | teacher16@demo.example.test |
| DVS-T017 | Kiran Shah | teacher17@demo.example.test |
| DVS-T018 | Avni Trivedi | teacher18@demo.example.test |
| DVS-T019 | Riya Bose | teacher19@demo.example.test |
| DVS-T020 | Dev Patel | teacher20@demo.example.test |

## Complete student directory

| Admission ID | Fictional name | Login | Class / section | Roll | State |
| --- | --- | --- | --- | ---: | --- |
| DVS-S001 | Nisha Kulkarni | student1@demo.example.test | Class 6 A | 1 | Active |
| DVS-S002 | Navya Rao | student2@demo.example.test | Class 6 B | 1 | Active |
| DVS-S003 | Avni Kapoor | student3@demo.example.test | Class 7 A | 1 | Active |
| DVS-S004 | Samar Bose | student4@demo.example.test | Class 7 B | 1 | Active |
| DVS-S005 | Ishaan Bose | student5@demo.example.test | Class 8 A | 1 | Active |
| DVS-S006 | Navya Sharma | student6@demo.example.test | Class 8 B | 1 | Active |
| DVS-S007 | Kavya Kulkarni | student7@demo.example.test | Class 9 A | 1 | Active |
| DVS-S008 | Diya Sharma | student8@demo.example.test | Class 9 B | 1 | Active |
| DVS-S009 | Kiran Saxena | student9@demo.example.test | Class 10 A | 1 | Active |
| DVS-S010 | Kabir Pillai | student10@demo.example.test | Class 10 B | 1 | Active |
| DVS-S011 | Aditya Patel | student11@demo.example.test | Class 6 A | 2 | Active |
| DVS-S012 | Diya Sethi | student12@demo.example.test | Class 6 B | 2 | Active |
| DVS-S013 | Mira Rao | student13@demo.example.test | Class 7 A | 2 | Active |
| DVS-S014 | Meera Sethi | student14@demo.example.test | Class 7 B | 2 | Active |
| DVS-S015 | Kabir Bose | student15@demo.example.test | Class 8 A | 2 | Active |
| DVS-S016 | Avni Iyer | student16@demo.example.test | Class 8 B | 2 | Active |
| DVS-S017 | Rehan Patel | student17@demo.example.test | Class 9 A | 2 | Active |
| DVS-S018 | Samar Shah | student18@demo.example.test | Class 9 B | 2 | Active |
| DVS-S019 | Yash Sethi | student19@demo.example.test | Class 10 A | 2 | Active |
| DVS-S020 | Nisha Saxena | student20@demo.example.test | Class 10 B | 2 | Active |
| DVS-S021 | Samar Trivedi | student21@demo.example.test | Class 6 A | 3 | Active |
| DVS-S022 | Meera Saxena | student22@demo.example.test | Class 6 B | 3 | Active |
| DVS-S023 | Aditya Trivedi | student23@demo.example.test | Class 7 A | 3 | Active |
| DVS-S024 | Aditya Verma | student24@demo.example.test | Class 7 B | 3 | Active |
| DVS-S025 | Sana Kulkarni | student25@demo.example.test | Class 8 A | 3 | Active |
| DVS-S026 | Aditya Patel | student26@demo.example.test | Class 8 B | 3 | Active |
| DVS-S027 | Dev Joshi | student27@demo.example.test | Class 9 A | 3 | Active |
| DVS-S028 | Nisha Kapoor | student28@demo.example.test | Class 9 B | 3 | Active |
| DVS-S029 | Aarav Sethi | student29@demo.example.test | Class 10 A | 3 | Active |
| DVS-S030 | Rehan Saxena | student30@demo.example.test | Class 10 B | 3 | Active |
| DVS-S031 | Navya Pillai | student31@demo.example.test | Class 6 A | 4 | Active |
| DVS-S032 | Ananya Iyer | student32@demo.example.test | Class 6 B | 4 | Active |
| DVS-S033 | Yash Saxena | student33@demo.example.test | Class 7 A | 4 | Active |
| DVS-S034 | Meera Desai | student34@demo.example.test | Class 7 B | 4 | Active |
| DVS-S035 | Nisha Sharma | student35@demo.example.test | Class 8 A | 4 | Active |
| DVS-S036 | Rohan Saxena | student36@demo.example.test | Class 8 B | 4 | Active |
| DVS-S037 | Kabir Joshi | student37@demo.example.test | Class 9 A | 4 | Active |
| DVS-S038 | Meera Nair | student38@demo.example.test | Class 9 B | 4 | Active |
| DVS-S039 | Neel Desai | student39@demo.example.test | Class 10 A | 4 | Active |
| DVS-S040 | Arjun Sen | student40@demo.example.test | Class 10 B | 4 | Active |
| DVS-S041 | Samar Kulkarni | student41@demo.example.test | Class 6 A | 5 | Active |
| DVS-S042 | Aditya Joshi | student42@demo.example.test | Class 6 B | 5 | Active |
| DVS-S043 | Aarav Bose | student43@demo.example.test | Class 7 A | 5 | Active |
| DVS-S044 | Neel Saxena | student44@demo.example.test | Class 7 B | 5 | Active |
| DVS-S045 | Nisha Bose | student45@demo.example.test | Class 8 A | 5 | Active |
| DVS-S046 | Navya Kulkarni | student46@demo.example.test | Class 8 B | 5 | Active |
| DVS-S047 | Ira Sen | student47@demo.example.test | Class 9 A | 5 | Active |
| DVS-S048 | Sana Iyer | student48@demo.example.test | Class 9 B | 5 | Active |
| DVS-S049 | Sana Desai | student49@demo.example.test | Class 10 A | 5 | Active |
| DVS-S050 | Mira Iyer | student50@demo.example.test | Class 10 B | 5 | Active |
| DVS-S051 | Yash Patel | student51@demo.example.test | Class 6 A | 6 | Active |
| DVS-S052 | Kavya Trivedi | student52@demo.example.test | Class 6 B | 6 | Active |
| DVS-S053 | Neel Bhat | student53@demo.example.test | Class 7 A | 6 | Active |
| DVS-S054 | Aditya Patel | student54@demo.example.test | Class 7 B | 6 | Active |
| DVS-S055 | Rehan Kulkarni | student55@demo.example.test | Class 8 A | 6 | Active |
| DVS-S056 | Ishaan Sen | student56@demo.example.test | Class 8 B | 6 | Active |
| DVS-S057 | Vihaan Mehta | student57@demo.example.test | Class 9 A | 6 | Active |
| DVS-S058 | Mira Trivedi | student58@demo.example.test | Class 9 B | 6 | Active |
| DVS-S059 | Riya Kapoor | student59@demo.example.test | Class 10 A | 6 | Active |
| DVS-S060 | Kavya Rao | student60@demo.example.test | Class 10 B | 6 | Active |
| DVS-S061 | Aarav Patel | student61@demo.example.test | Class 6 A | 7 | Active |
| DVS-S062 | Diya Trivedi | student62@demo.example.test | Class 6 B | 7 | Active |
| DVS-S063 | Riya Menon | student63@demo.example.test | Class 7 A | 7 | Active |
| DVS-S064 | Ananya Pillai | student64@demo.example.test | Class 7 B | 7 | Active |
| DVS-S065 | Rehan Sharma | student65@demo.example.test | Class 8 A | 7 | Active |
| DVS-S066 | Dev Trivedi | student66@demo.example.test | Class 8 B | 7 | Active |
| DVS-S067 | Vihaan Bose | student67@demo.example.test | Class 9 A | 7 | Active |
| DVS-S068 | Rohan Rao | student68@demo.example.test | Class 9 B | 7 | Active |
| DVS-S069 | Neel Menon | student69@demo.example.test | Class 10 A | 7 | Active |
| DVS-S070 | Ishaan Patel | student70@demo.example.test | Class 10 B | 7 | Active |
| DVS-S071 | Vihaan Rao | student71@demo.example.test | Class 6 A | 8 | Active |
| DVS-S072 | Nisha Joshi | student72@demo.example.test | Class 6 B | 8 | Active |
| DVS-S073 | Mira Shah | student73@demo.example.test | Class 7 A | 8 | Active |
| DVS-S074 | Avni Patel | student74@demo.example.test | Class 7 B | 8 | Active |
| DVS-S075 | Arjun Sharma | student75@demo.example.test | Class 8 A | 8 | Active |
| DVS-S076 | Avni Shah | student76@demo.example.test | Class 8 B | 8 | Active |
| DVS-S077 | Yash Nair | student77@demo.example.test | Class 9 A | 8 | Active |
| DVS-S078 | Tara Bhat | student78@demo.example.test | Class 9 B | 8 | Active |
| DVS-S079 | Ira Pillai | student79@demo.example.test | Class 10 A | 8 | Active |
| DVS-S080 | Diya Joshi | student80@demo.example.test | Class 10 B | 8 | Active |
| DVS-S081 | Nisha Sharma | student81@demo.example.test | Class 6 A | 9 | Active |
| DVS-S082 | Arjun Mehta | student82@demo.example.test | Class 6 B | 9 | Active |
| DVS-S083 | Navya Sethi | student83@demo.example.test | Class 7 A | 9 | Active |
| DVS-S084 | Tara Sen | student84@demo.example.test | Class 7 B | 9 | Active |
| DVS-S085 | Kiran Sharma | student85@demo.example.test | Class 8 A | 9 | Active |
| DVS-S086 | Kabir Shah | student86@demo.example.test | Class 8 B | 9 | Active |
| DVS-S087 | Kavya Sethi | student87@demo.example.test | Class 9 A | 9 | Active |
| DVS-S088 | Samar Shah | student88@demo.example.test | Class 9 B | 9 | Active |
| DVS-S089 | Diya Sen | student89@demo.example.test | Class 10 A | 9 | Active |
| DVS-S090 | Kiran Nair | student90@demo.example.test | Class 10 B | 9 | Active |
| DVS-S091 | Meera Saxena | student91@demo.example.test | Class 6 A | 10 | Active |
| DVS-S092 | Yash Joshi | student92@demo.example.test | Class 6 B | 10 | Active |
| DVS-S093 | Yash Joshi | student93@demo.example.test | Class 7 A | 10 | Active |
| DVS-S094 | Navya Trivedi | student94@demo.example.test | Class 7 B | 10 | Active |
| DVS-S095 | Tara Pillai | student95@demo.example.test | Class 8 A | 10 | Active |
| DVS-S096 | Rohan Iyer | student96@demo.example.test | Class 8 B | 10 | Active |
| DVS-S097 | Mira Bhat | student97@demo.example.test | Class 9 A | 10 | Active |
| DVS-S098 | Sana Kapoor | student98@demo.example.test | Class 9 B | 10 | Active |
| DVS-S099 | Kavya Saxena | student99@demo.example.test | Class 10 A | 10 | Active |
| DVS-S100 | Tara Kapoor | student100@demo.example.test | Class 10 B | 10 | Active |
| DVS-S101 | Tara Shah | student101@demo.example.test | Class 6 A | 11 | Active |
| DVS-S102 | Vihaan Sen | student102@demo.example.test | Class 6 B | 11 | Active |
| DVS-S103 | Avni Joshi | student103@demo.example.test | Class 7 A | 11 | Active |
| DVS-S104 | Tara Menon | student104@demo.example.test | Class 7 B | 11 | Active |
| DVS-S105 | Kabir Rao | student105@demo.example.test | Class 8 A | 11 | Active |
| DVS-S106 | Avni Menon | student106@demo.example.test | Class 8 B | 11 | Active |
| DVS-S107 | Avni Kapoor | student107@demo.example.test | Class 9 A | 11 | Active |
| DVS-S108 | Nisha Rao | student108@demo.example.test | Class 9 B | 11 | Active |
| DVS-S109 | Sana Trivedi | student109@demo.example.test | Class 10 A | 11 | Active |
| DVS-S110 | Tara Kulkarni | student110@demo.example.test | Class 10 B | 11 | Active |
| DVS-S111 | Neel Verma | student111@demo.example.test | Class 6 A | 12 | Active |
| DVS-S112 | Riya Rao | student112@demo.example.test | Class 6 B | 12 | Active |
| DVS-S113 | Yash Joshi | student113@demo.example.test | Class 7 A | 12 | Active |
| DVS-S114 | Dev Sethi | student114@demo.example.test | Class 7 B | 12 | Active |
| DVS-S115 | Samar Pillai | student115@demo.example.test | Class 8 A | 12 | Active |
| DVS-S116 | Ishaan Bose | student116@demo.example.test | Class 8 B | 12 | Active |
| DVS-S117 | Kavya Sethi | student117@demo.example.test | Class 9 A | 12 | Active |
| DVS-S118 | Riya Shah | student118@demo.example.test | Class 9 B | 12 | Active |
| DVS-S119 | Mira Kulkarni | student119@demo.example.test | Class 10 A | 12 | Active |
| DVS-S120 | Yash Nair | student120@demo.example.test | Class 10 B | 12 | Active |
| DVS-S121 | Tara Sen | student121@demo.example.test | Class 6 A | 13 | Active |
| DVS-S122 | Kabir Verma | student122@demo.example.test | Class 6 B | 13 | Active |
| DVS-S123 | Meera Verma | student123@demo.example.test | Class 7 A | 13 | Active |
| DVS-S124 | Tara Bhat | student124@demo.example.test | Class 7 B | 13 | Active |
| DVS-S125 | Aditya Pillai | student125@demo.example.test | Class 8 A | 13 | Active |
| DVS-S126 | Sana Sen | student126@demo.example.test | Class 8 B | 13 | Active |
| DVS-S127 | Sana Iyer | student127@demo.example.test | Class 9 A | 13 | Active |
| DVS-S128 | Aarav Bose | student128@demo.example.test | Class 9 B | 13 | Active |
| DVS-S129 | Nisha Nair | student129@demo.example.test | Class 10 A | 13 | Active |
| DVS-S130 | Diya Saxena | student130@demo.example.test | Class 10 B | 13 | Active |
| DVS-S131 | Mira Bose | student131@demo.example.test | Class 6 A | 14 | Active |
| DVS-S132 | Arjun Sethi | student132@demo.example.test | Class 6 B | 14 | Active |
| DVS-S133 | Rehan Verma | student133@demo.example.test | Class 7 A | 14 | Active |
| DVS-S134 | Aarav Joshi | student134@demo.example.test | Class 7 B | 14 | Active |
| DVS-S135 | Navya Shah | student135@demo.example.test | Class 8 A | 14 | Active |
| DVS-S136 | Aditya Saxena | student136@demo.example.test | Class 8 B | 14 | Active |
| DVS-S137 | Vihaan Patel | student137@demo.example.test | Class 9 A | 14 | Active |
| DVS-S138 | Tara Shah | student138@demo.example.test | Class 9 B | 14 | Active |
| DVS-S139 | Ananya Verma | student139@demo.example.test | Class 10 A | 14 | Active |
| DVS-S140 | Rohan Menon | student140@demo.example.test | Class 10 B | 14 | Active |
| DVS-S141 | Aarav Menon | student141@demo.example.test | Class 6 A | 15 | Active |
| DVS-S142 | Kabir Verma | student142@demo.example.test | Class 6 B | 15 | Active |
| DVS-S143 | Samar Kulkarni | student143@demo.example.test | Class 7 A | 15 | Active |
| DVS-S144 | Ira Kapoor | student144@demo.example.test | Class 7 B | 15 | Active |
| DVS-S145 | Kabir Sharma | student145@demo.example.test | Class 8 A | 15 | Active |
| DVS-S146 | Nisha Joshi | student146@demo.example.test | Class 8 B | 15 | Active |
| DVS-S147 | Yash Menon | student147@demo.example.test | Class 9 A | 15 | Active |
| DVS-S148 | Rehan Bose | student148@demo.example.test | Class 9 B | 15 | Active |
| DVS-S149 | Aarav Rao | student149@demo.example.test | Class 10 A | 15 | Active |
| DVS-S150 | Sana Rao | student150@demo.example.test | Class 10 B | 15 | Active |
| DVS-S151 | Kavya Patel | student151@demo.example.test | Class 6 A | 16 | Active |
| DVS-S152 | Sana Shah | student152@demo.example.test | Class 6 B | 16 | Active |
| DVS-S153 | Ananya Iyer | student153@demo.example.test | Class 7 A | 16 | Active |
| DVS-S154 | Kabir Nair | student154@demo.example.test | Class 7 B | 16 | Active |
| DVS-S155 | Rehan Patel | student155@demo.example.test | Class 8 A | 16 | Active |
| DVS-S156 | Kiran Joshi | student156@demo.example.test | Class 8 B | 16 | Active |
| DVS-S157 | Kabir Kulkarni | student157@demo.example.test | Class 9 A | 16 | Active |
| DVS-S158 | Rehan Trivedi | student158@demo.example.test | Class 9 B | 16 | Active |
| DVS-S159 | Kavya Sharma | student159@demo.example.test | Class 10 A | 16 | Active |
| DVS-S160 | Riya Rao | student160@demo.example.test | Class 10 B | 16 | Active |
| DVS-S161 | Vihaan Sethi | student161@demo.example.test | Class 6 A | 17 | Active |
| DVS-S162 | Nisha Nair | student162@demo.example.test | Class 6 B | 17 | Active |
| DVS-S163 | Vihaan Patel | student163@demo.example.test | Class 7 A | 17 | Active |
| DVS-S164 | Kavya Rao | student164@demo.example.test | Class 7 B | 17 | Active |
| DVS-S165 | Nisha Shah | student165@demo.example.test | Class 8 A | 17 | Active |
| DVS-S166 | Yash Shah | student166@demo.example.test | Class 8 B | 17 | Active |
| DVS-S167 | Sana Bose | student167@demo.example.test | Class 9 A | 17 | Active |
| DVS-S168 | Kiran Nair | student168@demo.example.test | Class 9 B | 17 | Active |
| DVS-S169 | Kabir Kulkarni | student169@demo.example.test | Class 10 A | 17 | Active |
| DVS-S170 | Mira Saxena | student170@demo.example.test | Class 10 B | 17 | Active |
| DVS-S171 | Arjun Sen | student171@demo.example.test | Class 6 A | 18 | Active |
| DVS-S172 | Kabir Kapoor | student172@demo.example.test | Class 6 B | 18 | Active |
| DVS-S173 | Yash Patel | student173@demo.example.test | Class 7 A | 18 | Active |
| DVS-S174 | Avni Rao | student174@demo.example.test | Class 7 B | 18 | Active |
| DVS-S175 | Rehan Menon | student175@demo.example.test | Class 8 A | 18 | Active |
| DVS-S176 | Kavya Iyer | student176@demo.example.test | Class 8 B | 18 | Active |
| DVS-S177 | Aarav Rao | student177@demo.example.test | Class 9 A | 18 | Active |
| DVS-S178 | Ananya Bose | student178@demo.example.test | Class 9 B | 18 | Active |
| DVS-S179 | Vihaan Saxena | student179@demo.example.test | Class 10 A | 18 | Active |
| DVS-S180 | Neel Rao | student180@demo.example.test | Class 10 B | 18 | Active |
| DVS-S181 | Rehan Desai | student181@demo.example.test | Class 6 A | 19 | Active |
| DVS-S182 | Neel Kapoor | student182@demo.example.test | Class 6 B | 19 | Active |
| DVS-S183 | Ira Nair | student183@demo.example.test | Class 7 A | 19 | Active |
| DVS-S184 | Navya Saxena | student184@demo.example.test | Class 7 B | 19 | Active |
| DVS-S185 | Mira Bose | student185@demo.example.test | Class 8 A | 19 | Active |
| DVS-S186 | Arjun Menon | student186@demo.example.test | Class 8 B | 19 | Active |
| DVS-S187 | Kiran Rao | student187@demo.example.test | Class 9 A | 19 | Active |
| DVS-S188 | Navya Sharma | student188@demo.example.test | Class 9 B | 19 | Active |
| DVS-S189 | Samar Patel | student189@demo.example.test | Class 10 A | 19 | Active |
| DVS-S190 | Nisha Bose | student190@demo.example.test | Class 10 B | 19 | Active |
| DVS-S191 | Kiran Trivedi | student191@demo.example.test | Class 6 A | 20 | Active |
| DVS-S192 | Samar Saxena | student192@demo.example.test | Class 6 B | 20 | Active |
| DVS-S193 | Aarav Shah | student193@demo.example.test | Class 7 A | 20 | Active |
| DVS-S194 | Tara Rao | student194@demo.example.test | Class 7 B | 20 | Active |
| DVS-S195 | Ira Saxena | student195@demo.example.test | Class 8 A | 20 | Active |
| DVS-S196 | Dev Kulkarni | student196@demo.example.test | Class 8 B | 20 | Active |
| DVS-S197 | Avni Bhat | student197@demo.example.test | Class 9 A | 20 | Active |
| DVS-S198 | Aarav Iyer | student198@demo.example.test | Class 9 B | 20 | Active |
| DVS-S199 | Kiran Menon | student199@demo.example.test | Class 10 A | 20 | Active |
| DVS-S200 | Aditya Shah | student200@demo.example.test | Class 10 B | 20 | Active |
| DVS-S201 | Samar Rao | student201@demo.example.test | Class 6 A | 21 | Active |
| DVS-S202 | Rehan Menon | student202@demo.example.test | Class 6 B | 21 | Active |
| DVS-S203 | Avni Kulkarni | student203@demo.example.test | Class 7 A | 21 | Active |
| DVS-S204 | Mira Nair | student204@demo.example.test | Class 7 B | 21 | Active |
| DVS-S205 | Navya Iyer | student205@demo.example.test | Class 8 A | 21 | Active |
| DVS-S206 | Rehan Sethi | student206@demo.example.test | Class 8 B | 21 | Active |
| DVS-S207 | Kiran Iyer | student207@demo.example.test | Class 9 A | 21 | Active |
| DVS-S208 | Sana Iyer | student208@demo.example.test | Class 9 B | 21 | Active |
| DVS-S209 | Vihaan Pillai | student209@demo.example.test | Class 10 A | 21 | Active |
| DVS-S210 | Kiran Saxena | student210@demo.example.test | Class 10 B | 21 | Active |
| DVS-S211 | Navya Verma | student211@demo.example.test | Class 6 A | 22 | Active |
| DVS-S212 | Kiran Sharma | student212@demo.example.test | Class 6 B | 22 | Active |
| DVS-S213 | Nisha Sen | student213@demo.example.test | Class 7 A | 22 | Active |
| DVS-S214 | Kabir Mehta | student214@demo.example.test | Class 7 B | 22 | Active |
| DVS-S215 | Riya Bhat | student215@demo.example.test | Class 8 A | 22 | Active |
| DVS-S216 | Kavya Trivedi | student216@demo.example.test | Class 8 B | 22 | Active |
| DVS-S217 | Kabir Trivedi | student217@demo.example.test | Class 9 A | 22 | Active |
| DVS-S218 | Nisha Kapoor | student218@demo.example.test | Class 9 B | 22 | Active |
| DVS-S219 | Mira Pillai | student219@demo.example.test | Class 10 A | 22 | Active |
| DVS-S220 | Kabir Iyer | student220@demo.example.test | Class 10 B | 22 | Active |
| DVS-S221 | Rehan Pillai | student221@demo.example.test | Class 6 A | 23 | Active |
| DVS-S222 | Avni Menon | student222@demo.example.test | Class 6 B | 23 | Active |
| DVS-S223 | Ishaan Kulkarni | student223@demo.example.test | Class 7 A | 23 | Active |
| DVS-S224 | Neel Sethi | student224@demo.example.test | Class 7 B | 23 | Active |
| DVS-S225 | Samar Mehta | student225@demo.example.test | Class 8 A | 23 | Active |
| DVS-S226 | Diya Iyer | student226@demo.example.test | Class 8 B | 23 | Active |
| DVS-S227 | Aarav Desai | student227@demo.example.test | Class 9 A | 23 | Active |
| DVS-S228 | Mira Saxena | student228@demo.example.test | Class 9 B | 23 | Active |
| DVS-S229 | Ananya Iyer | student229@demo.example.test | Class 10 A | 23 | Active |
| DVS-S230 | Arjun Sethi | student230@demo.example.test | Class 10 B | 23 | Active |
| DVS-S231 | Avni Patel | student231@demo.example.test | Class 6 A | 24 | Active |
| DVS-S232 | Aditya Sen | student232@demo.example.test | Class 6 B | 24 | Active |
| DVS-S233 | Samar Bhat | student233@demo.example.test | Class 7 A | 24 | Active |
| DVS-S234 | Riya Patel | student234@demo.example.test | Class 7 B | 24 | Active |
| DVS-S235 | Vihaan Sen | student235@demo.example.test | Class 8 A | 24 | Active |
| DVS-S236 | Rohan Iyer | student236@demo.example.test | Class 8 B | 24 | Active |
| DVS-S237 | Meera Sethi | student237@demo.example.test | Class 9 A | 24 | Active |
| DVS-S238 | Diya Mehta | student238@demo.example.test | Class 9 B | 24 | Active |
| DVS-S239 | Ishaan Sen | student239@demo.example.test | Class 10 A | 24 | Active |
| DVS-S240 | Aditya Joshi | student240@demo.example.test | Class 10 B | 24 | Active |
| DVS-S241 | Samar Rao | student241@demo.example.test | Class 6 A | 25 | Active |
| DVS-S242 | Dev Saxena | student242@demo.example.test | Class 6 B | 25 | Active |
| DVS-S243 | Riya Shah | student243@demo.example.test | Class 7 A | 25 | Active |
| DVS-S244 | Neel Sethi | student244@demo.example.test | Class 7 B | 25 | Active |
| DVS-S245 | Mira Pillai | student245@demo.example.test | Class 8 A | 25 | Active |
| DVS-S246 | Ishaan Bose | student246@demo.example.test | Class 8 B | 25 | Active |
| DVS-S247 | Rehan Sen | student247@demo.example.test | Class 9 A | 25 | Active |
| DVS-S248 | Mira Verma | student248@demo.example.test | Class 9 B | 25 | Active |
| DVS-S249 | Aarav Menon | student249@demo.example.test | Class 10 A | 25 | Inactive |
| DVS-S250 | Neel Desai | student250@demo.example.test | Class 10 B | 25 | Inactive |

Machine-readable synthetic catalog: demo-data/catalog.json. It contains no passwords, hashes, tokens or database connection strings.
