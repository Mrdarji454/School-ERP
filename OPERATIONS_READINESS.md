# Operations readiness and recovery handoff

Prepared 18 October 2026. No deployment, production database access, live-data changes, or school pilot has been performed. Existing application routes and business behavior are unchanged by this handoff.

## Verification recorded in this workspace

- Full integration suite passed **909 HTTP checks**, including the restored API and ownership/error cases. Recovery compared **32 collections, 302 records, 13 private PDFs and four issued report cards**, including corrected history. The synthetic recovery phase took 14.353 seconds on this workstation; this is not a production performance guarantee.
- Local packaging readiness passed. The database readiness check passed against the restored replica set and correctly failed when required report-card indexes were absent.
- Synthetic configuration checks accepted a valid configuration and rejected an HTTP origin, invalid timezone, public storage path, missing secret and invalid file-size limit without making a database connection.
- Frontend lint, **32 frontend tests**, production build, **12 backend tests**, **262 backend import checks**, and `git diff --check` passed. The existing large-bundle advisory remains.
- Fixed a test isolation defect: the failed-issuance cleanup test now ages only its own orphan file instead of advancing the cleanup clock for every other module's fixtures. Application cleanup behavior did not change.
- Integration output: `.verification/recovery-integration.log`. Demo output: `.verification/recovery-demo.log`.
- All **four demo tests passed**, including full seed, guarded reset, extension reruns/manual-edit preservation and multi-page report-card assertions.

## Repeatable local checks

From the repository root in PowerShell:

```powershell
npm run check:readiness --prefix server -- --local
$env:TEST_MONGOD='C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe'
$env:REPORTCARD_PYTHON=(Resolve-Path server/.reportcard-venv/Scripts/python.exe).Path
npm run test:integration --prefix server
```

The readiness script does not load `.env`, print credentials, initialize models/indexes, or write to MongoDB. Local mode checks Node, the built frontend entry, original-logo digest, Python and the pinned ReportLab runtime. It does not certify production readiness or frontend build freshness; run the frontend build separately.

For an approved staging environment, inject configuration through the service's secret manager and run `npm run check:readiness --prefix server -- --database`. Without `--local`, checks additionally require production mode, an HTTPS client origin, an explicit valid school timezone, a configured secret of at least 32 characters, valid upload limit and an existing writable private storage directory. `--database` performs read-only replica-primary and report-card unique-index checks using the supplied `MONGO_URI`. The script deliberately reports generic failures without echoing secrets. A failed check exits nonzero. A passing check does not establish secret randomness, filesystem ACL security, TLS configuration, disk capacity, or availability of every application index.

## Automated synthetic recovery

The full integration suite now ends with `server/tests/recovery.js`. After fixture writers finish, it saves every application collection as lossless Extended JSON, collection options/indexes, all private PDF files, and a SHA-256 manifest. It restores into a new, empty `erp_restore_check_*` database on the test-owned loopback replica set and a new private directory. It never drops or overwrites an existing database or accepts an external source URI.

It compares all restored records and indexes, verifies every copied file hash, then points the test API at the restored database/storage. It checks Admin authentication; original and corrected report-card downloads as Admin and owning Students; anonymous and cross-Student denial; and visible failure/recovery after deliberately corrupting a synthetic restored PDF. Readiness must pass against the restored database and fail against a database lacking required uniqueness indexes. The original source database and private directory are retained unchanged.

Evidence is retained under `server/.test-data/erp-*/recovery-backup-*/result.json` and `manifest.ejson`. These are ignored synthetic test artifacts. This small, quiesced EJSON test is **not a production backup format or a MongoDB Database Tools restore rehearsal**. It does not test users/roles, replica configuration, encryption keys, infrastructure loss, large-volume throughput, or point-in-time recovery. Do not run this helper against school data. Its elapsed time is not a production recovery-time objective.

## Production backup and restore procedure — pending infrastructure rehearsal

MongoDB Database Tools (`mongodump`/`mongorestore`) were unavailable in this workspace. The deployment operator must install compatible official tools or use the hosting provider's supported snapshot service, then rehearse on disposable staging infrastructure before go-live.

1. Agree recovery-point and recovery-time targets, retention, backup owner and restore approver with the school. Record actual values before pilot approval; no target is assumed here.
2. Put the application in maintenance mode at the reverse proxy. Drain and stop **all** API instances, workers, seeders, imports and cleanup jobs that can write the database or private files. Keep writes paused throughout both captures. Record the release identifier, configuration schema, school timezone, MongoDB/tools versions, backup timestamp and storage location without copying secrets into logs.
3. Capture the application database with indexes using official MongoDB tools or a consistent managed snapshot. Capture the entire matching private storage directory, including resources, assignment attachments/submissions and all original/superseded report cards. Keep both captures under one backup identifier with checksums and a completion marker written only after both succeed. A failed/incomplete pair is not a usable recovery point.
4. Encrypt the backup at rest and in transit, restrict access, retain a separate off-host copy, and alert on failures or overdue backups. Protect encryption keys separately and verify recovery access. Resume service only after the captures complete or the failed attempt has been safely abandoned.
5. Restore to **new isolated** database/storage targets, never over the active school database. Match compatible server/tool versions. Restore application indexes and separately provision the approved least-privilege database credentials. Point an isolated API at both restored targets with outbound integrations disabled.
6. Compare collection counts/indexes and artifact hashes. Log in as synthetic approved test accounts; test issued and superseded PDF downloads, wrong-owner denial, resources, assignment submissions, fee receipts/balances and salary history. Reconcile published results and financial audit history. Record elapsed recovery time, backup age and every discrepancy.
7. Only after approval, plan a separate production recovery/cutover. Stop writers, retain the pre-cutover state, switch the database and private storage **together**, and repeat smoke checks. Never mix a newer database with older files or regenerate missing immutable PDFs under old document identifiers.

MongoDB documents that consistent dumps require a write pause or an appropriate oplog-based backup; `--oplog` has restrictions and is not interchangeable with a database-scoped dump. The paired write-pause procedure above also coordinates external PDF files. See [MongoDB backup consistency](https://www.mongodb.com/docs/manual/tutorial/backup-and-restore-tools/) and [mongodump options](https://www.mongodb.com/docs/database-tools/mongodump/). Do not copy connection strings into tickets or command transcripts.

## Deployment gates

| Gate | Required evidence before pilot |
| --- | --- |
| Reproducible release | Lockfile installs, frontend build, backend checks; retained release artifact and rollback artifact |
| PDF runtime | Python 3.10+, pinned ReportLab, packaged renderer/logo/font; actual render and visual acceptance in target OS |
| Data safety | Writable replica primary; all model indexes reviewed/provisioned; no automatic destructive migration/backfill |
| Private files | Durable private storage, service-account-only ACLs, no public static mount; shared access if running multiple API instances |
| HTTPS and secrets | Valid certificates, exact frontend origin, strong secret from secret manager, production cookie/proxy configuration reviewed |
| Process lifecycle | Supervisor restarts and reverse-proxy draining verified; current server has no explicit graceful-shutdown handler, so stop accepting traffic and wait for in-flight requests before restart |
| Capacity | Disk headroom, bounded PDF concurrency, upload limits, backup capacity and load test on expected school workload |
| Recovery | Official-tools/managed-snapshot restoration and paired-file validation on staging; school-approved RPO/RTO |
| Acceptance | All rows in SCHOOL_ACCEPTANCE_CHECKLIST.md with browser/device/evidence and approver |

The current root `GET /` is only a process/HTTP probe. It is **not database readiness**. The CLI database check is for periodic restricted operator checks, not a public endpoint. No new public diagnostics or metrics exposing school information were added.

## Monitoring setup for the deployment operator

Configure these in the selected hosting/monitoring system; nothing has been installed in a live service:

| Signal | Initial alert policy to validate during staging | Response |
| --- | --- | --- |
| HTTPS/API probe | Two consecutive failed one-minute probes | Check process, proxy and database; pause pilot writes if inconsistent |
| Database readiness | Read-only replica/index check fails | Investigate election/connectivity/index readiness; do not switch to standalone |
| API errors/latency | Sustained 5xx increase or latency beyond staging baseline | Correlate deployment and database/PDF failures; escalate to operator |
| PDF failures | Any missing/corrupt issued artifact; repeated renderer timeout/queue-full errors | Preserve identifiers, verify storage/runtime; recover original bytes |
| Storage | Warn at 80% used, critical at 90%; tune for backup size and growth | Expand safely; never purge referenced issued documents |
| Backup | Job failure, incomplete pair, or backup age above agreed RPO | Retry/escalate and verify a fresh restore |
| Security | Unexpected authorization-failure spike or credential abuse | Review sanitized access logs; follow account/incident procedure |

Log timestamp, request method, route template, status, duration and a correlation identifier at the proxy/service layer. Exclude authorization headers, cookies, request bodies, passwords, uploaded documents, marks and financial details. Restrict log access and retention. Test alert delivery to a designated operator using a synthetic staging failure. No messages or alerts were sent by this work.

## Controlled pilot — plan only

1. School appoints an operator, an Admin reviewer, a Teacher reviewer and Student/guardian representatives; record contacts privately. Agree the pilot class/section, academic year, dates, scope and support hours.
2. First complete synthetic staging acceptance and the restore/alert drills. Resolve all privacy, financial, history and document-integrity failures before introducing real records. Browser access is unavailable in this session, so this gate remains open.
3. Obtain explicit approval for real-data onboarding and deployment. Limit the initial cohort, train reviewers on corrections/reversals and publication, and establish reconciliation with the school's authoritative records.
4. Review daily: account access, attendance denominator, balances/receipts, publication versions, PDF downloads, errors, backups and support issues. Record evidence without distributing student data in general logs.
5. Stop expansion for cross-account exposure, lost audit/history, mismatched finances or immutable document corruption. Pause affected writes, preserve evidence, and use the approved recovery procedure. Do not roll a database backward casually: doing so can discard newly recorded payments or marks.
6. Expand only after the school signs off on completed workflows, reconciled records, successful recovery and alert drills, and resolved critical defects. No pilot accounts, data, notifications or deployment were created here.

## Remaining acceptance limits

- Browser desktop/tablet/mobile and keyboard/printing checks remain pending; no browser was connected.
- Official backup tools/provider restoration, production configuration, TLS, monitoring delivery, capacity, ACLs and process-drain behavior require target-infrastructure evidence.
- Gujarati/Hindi font shaping remains unverified. The existing frontend bundle-size advisory and per-process PDF concurrency limits remain documented in REPORT_CARD_MILESTONE_REPORT.md.

Use SCHOOL_ACCEPTANCE_CHECKLIST.md for the workflow matrix and REPORT_CARD_DEMO_REPORT.md for synthetic report-card scenarios.
