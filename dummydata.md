# Local dummy data for testing

Use the dedicated demo database for test data. These commands do not use
`server/.env` or the normal school database configured by `MONGO_URI`.

**Current local setup:** the demo data has already been copied into the local
`school` database, and the regular API was verified with the example admin
login. Do not run the copy command again against this database; it now contains
data and the utility will refuse to copy into it again.

## Run the regular app with the copied data

The regular API runs at `http://localhost:5000`. Start it from the repository
root if it is not already running:

```powershell
cd server
npm run dev
```

In a second terminal, start the regular frontend:

```powershell
cd client
npm run dev
```

Open `http://localhost:5173/login` (use `localhost`, not `127.0.0.1`, to match
the API's configured CORS origin), then use one of the example accounts below.
The regular API connects to the local database selected by `MONGO_URI`.

## Start the isolated demo

Open three PowerShell terminals from the repository root.

### Terminal 1: start the local demo database

```powershell
cd server
npm run demo:db
```

Keep this terminal running. The demo database listens only on localhost and
stores its files under `server/.demo-data/`.

### Terminal 2: seed the demo and start its API

```powershell
cd server
. .\scripts\demo\use-local-demo.ps1
npm run seed:demo
npm run seed:demo:verify
npm run demo:server
```

The demo API runs at `http://127.0.0.1:5001`.

### Terminal 3: start the frontend

```powershell
cd client
. ..\server\scripts\demo\use-local-demo.ps1
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Open `http://127.0.0.1:5174/login`.

## Example accounts

All demo accounts use this default development-only password:

```text
DemoSchool123!
```

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.example.test` | `DemoSchool123!` |
| Teacher | `teacher1@demo.example.test` | `DemoSchool123!` |
| Student | `student1@demo.example.test` | `DemoSchool123!` |

For API testing, login uses:

```http
POST http://127.0.0.1:5001/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@demo.example.test",
  "password": "DemoSchool123!"
}
```

Use the corresponding teacher or student email to test those roles.

## Copy the demo into the normal local database

For a **new, empty local database**, the demo records can be copied to the
database selected by `server/.env` → `MONGO_URI`. The copy utility only permits
a local MongoDB host and refuses production mode, the demo database itself, or
a destination that already contains documents. It never reads or prints URI
credentials.

First ensure `MONGO_URI` points to the local database you intend to use, and
that it is empty. Keep the dedicated demo database running, stop the demo API,
then run from `server/`:

```powershell
. .\scripts\demo\use-local-demo.ps1
npm run seed:demo:copy-to-local
```

After a successful copy, start the regular server with `npm run dev` from
`server/`, and use the regular frontend (`npm run dev` from `client/`). The
ordinary server uses `MONGO_URI`; the demo API continues to use only its
separate database. If the destination is not empty, the copy stops without
changing it; do not clear a database unless you have confirmed it contains no
needed data.

## What gets created

The existing demo seeder builds a connected, fictional school dataset for
testing workflows: **1 Admin, 20 Teachers, and 250 Students**. The accounts
in the table are one example of each role. Two student accounts in the larger
fixture are intentionally inactive. Names, addresses, phone numbers, and
financial records in the fixture are synthetic. Do not use this default
password outside the local demo.

The first seed requires the dedicated database to be empty. A completed seed
rerun is a no-op; it will not reset account passwords or overwrite test edits.
To rebuild the demo dataset, first stop the demo API, then from `server/` run:

```powershell
. .\scripts\demo\use-local-demo.ps1
npm run seed:demo:reset -- --confirm-demo-reset
npm run seed:demo
npm run seed:demo:verify
```

Reset is restricted to the dedicated `school_erp_demo` database and requires
the explicit confirmation flag. Never point demo commands at production data.
