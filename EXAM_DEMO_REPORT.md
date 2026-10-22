# Exam demo data and repeatable test guide

Use only the dedicated synthetic demo database described in the existing demo setup documentation. Never point these commands at live school data.

Prerequisites: completed base demo, completed enrollment extension, explicit `DEMO_MONGODB_URI` for `school_erp_demo`, existing demo credentials/configuration, and a writable local replica set.

```powershell
npm run seed:demo:exams --prefix server
npm run seed:demo:exams:verify --prefix server
```

The extension is additive. Completed reruns preserve manual changes, dates and original result versions. No reset is required. Dates are deliberately fixed to the 2026–2027 synthetic school year; after the entry deadline in March 2027, seed-time dates must receive an explicit fixture revision rather than silently changing historical results.

| Scenario name | Expected behavior |
| --- | --- |
| DEMO: Draft setup | Editable draft, no roster or schedule |
| DEMO: Scheduled sitting | Draft with a scheduled sitting; structural setup locked |
| DEMO: Missing, zero, absent and exempt | Open entry; real zero, explicit absence/exemption and at least one missing entry; cannot submit incomplete component |
| DEMO: Submitted for review | Both components submitted; Teacher cannot edit |
| DEMO: Returned component | Written marks returned with reason; Practical remains submitted |
| DEMO: Approved, not yet published | Approved and locked; no Student published result |
| DEMO: Published result with transferred candidate | Student can view own immutable result using the captured pre-transfer section |
| DEMO: Reviewed publication correction | Original and corrected publication versions retained; written correction reason/audit recorded |

All exams use the existing enrollment-demo current year, Class 6, Section A, English subject, and two components (**Written**, **Practical**, maximum 20 each). The responsible Teacher is the existing teacher from the enrollment-demo Section A assignment. Candidate eligibility is **1 April 2026**. Sittings use distinct October dates at **17:00–17:45 school time**. The captured transfer candidate is the existing `transfer@enrollment-demo.example.test` synthetic account; its current Section B placement does not replace the historical Section A result.

The fixture policy explicitly sums contributing scored components, rounds half-up to two decimals, withholds a total for contributing absence and excludes permitted exemptions from numerator and denominator. It configures no overall pass threshold or grade labels. These are demo choices, not an invented school grading policy.

Use the original local demo credential configuration; credentials are not copied into this report. The extension manifest is `demo-exams-v1`. It records deterministic exam identities and owned fixture IDs. For interrupted builds, rerun the same extension; it resumes existing scenarios. For completed data, reruns return without modifying manual edits. The verifier checks scenario semantics; deliberately changing workflow states can therefore make verification fail without authorizing a reset.

Automated isolated checks:

```powershell
$env:TEST_MONGOD='C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
npm run test:exams --prefix server
npm run test:demo --prefix server
```

These tests start disposable loopback replica sets and do not read the normal server `.env` database URI. See [EXAM_MILESTONE_REPORT.md](EXAM_MILESTONE_REPORT.md) for the end-to-end browser checklist.
