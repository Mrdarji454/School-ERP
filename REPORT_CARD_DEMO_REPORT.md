# Report-card dummy data and repeatable testing

Use the existing guarded, disposable `school_erp_demo` database only. Prerequisites: completed base, enrollment and exam extensions, explicit `DEMO_MONGODB_URI`, the configured demo password, a writable replica set and the report-card Python runtime.

```powershell
npm run seed:demo:report-cards --prefix server
npm run seed:demo:report-cards:verify --prefix server
```

This extension was verified in disposable test fixtures, not run against existing live school data. The manifest is `demo-report-cards-v1`. Completed reruns return without changing manual records or issued files. An interrupted build resumes owned fixtures. A collision with unmanaged fixture identities fails explicitly; nothing is reset automatically.

| Scenario | Source / expected check |
| --- | --- |
| Normal report / genuine zero | Published exam demo 6; recorded zero stays numeric zero |
| Absence / permitted exemption | Other candidate in exam demo 6; explicit states retained and unsupported total withheld |
| Transferred candidate | Existing transfer demo account keeps its captured Section A report while currently in Section B |
| Corrected report | Exam demo 7 publications 1 and 2; both issues retained, second requires audited reason |
| Long name / many components | New `long-name@report-card-demo.example.test` account and dedicated 36-component exam; genuine publication workflow produces a multi-page report with repeated headers and page numbers |

Five issued cards are expected. The long-name fixture creates one additional fictional Student/User with an explicit 1 April 2026 enrollment in the enrollment-demo current class/Section A, roll 900. It does not rename an existing Student or alter an existing exam. Its dedicated exam contains zero, absent and exempt examples and explicitly configured sum/exclusion rules with no invented grade or pass threshold.

The new account uses the existing demo password configuration and retains onboarding restrictions; complete its initial password change before Student portal use. Credentials are not duplicated in this report. Example remarks are visibly synthetic and explicitly supplied by the demo Admin.

To test in the UI, Admin opens Report cards, chooses the exact exam/publication version and captured class/section, previews source marks, selects candidates, enters any authorized remarks and generates. Open the issued PDF and compare it with the selected publication. For corrected data, open both historical issues and check the superseded/latest labels. Rerunning the seed must preserve manual profile changes and the same artifact hashes.

Automated checks use temporary loopback-only replica sets and isolated private-file directories:

```powershell
$env:TEST_MONGOD='C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
$env:REPORTCARD_PYTHON=(Resolve-Path server/.reportcard-venv/Scripts/python.exe).Path
server/.reportcard-venv/Scripts/python.exe -m pip install pymupdf==1.28.2
npm run test:report-cards --prefix server
npm run test:demo --prefix server
```

The existing exam/deadline fixtures use the 2026-2027 academic year. After their March 2027 entry deadline, review and version the fixtures explicitly instead of silently changing issued history.
