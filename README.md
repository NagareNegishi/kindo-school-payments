# Kindo School Payments

A parent registers a child for a school field trip and pays for it online. The backend is FastAPI on PostgreSQL, the frontend is React with Tailwind, and card payments go to a mock legacy processor through an adapter.

How AI was used to build this, including where it went wrong: [AI_WORKINGS.md](AI_WORKINGS.md).

## What it does

1. The parent picks themselves from a dropdown in the header. There is no login, so the dropdown stands in for one.
2. The page lists upcoming trips (title, date, location, cost, description). Above the list are that parent's unpaid registrations, past trips included, each with a Pay button.
3. "Register a child" on a trip lets the parent pick one of their children or add a new one. Children already registered for that trip are marked and cannot be picked.
4. The payment form takes card number, expiry and CVV. The amount is shown and cannot be edited. Each field is checked on blur and on submit.
5. While the payment runs (about 1.5 seconds) the button is disabled and shows a spinner.
   - A decline shows the processor's message and a Retry button on the same form.
   - A network or server error shows a banner with Retry and keeps what was typed.
   - An error the backend ties to a field appears on that field.
6. A successful payment shows a receipt: transaction ID, amount, date, child, trip and the last four card digits.

## Setup

You need Docker and VS Code with the Dev Containers extension. The container has Python 3.14, uv, Node, and a Postgres 14.3 service. Ports 8000, 5173 and 5432 are forwarded.

1. Create `.devcontainer/.env` (gitignored) with `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB=kindo`. The container builds `DATABASE_URL` from them.
2. Open the folder in VS Code and choose "Reopen in Container".
3. Start the backend. On start it runs the migrations and the seed.

   ```bash
   cd backend
   uv sync
   uv run fastapi dev        # http://localhost:8000
   ```

4. Start the frontend in a second terminal.

   ```bash
   cd frontend
   npm install
   npm run dev               # http://localhost:5173
   ```

5. Open http://localhost:5173 and pick a parent.

If an install is rejected, the container firewall has stale addresses. Rerun `sudo /usr/local/bin/project-firewall.sh`.

### Tests and checks

```bash
cd backend
uv run pytest
uv run ruff check . && uv run ruff format --check .

cd frontend
npm test
npm run lint && npx prettier --check .
npm run build
```

The backend tests use the same database as the app. Each test runs inside a transaction that is rolled back, so the data you see in the app is left alone. One test (`test_startup`) runs the real start-up, which is safe because the seed only adds what is missing.

### Configuration

| Variable | Used by | Default |
| --- | --- | --- |
| `DATABASE_URL` | backend | none; the backend will not start without it. A plain `postgresql://` URL is converted to the asyncpg form. |
| `FRONTEND_ORIGIN` | backend (CORS) | `http://localhost:5173` |
| `VITE_API_URL` | frontend, read at build time | `http://localhost:8000` |
| `DEMO_RESET_ENABLED` | backend; turns on `POST /demo/reset` | off |

### Seed data

On start the backend adds, only if missing: one school, one trip ("Zoo Trip", $45.00, Auckland Zoo, dated 30 days after the first start), and three parents. Aroha Smith has two children (Mia, Liam), Tom Wilson has one (Ella), and Priya Patel has none.

### Reset the demo data

To go back to the seed (no registrations, payments or added children), call the reset endpoint. It is off by default, so enable it for local use first.

1. Start the backend with the flag set:

   ```bash
   cd backend
   DEMO_RESET_ENABLED=true uv run fastapi dev
   ```

2. Call the endpoint. It returns 204 and the app is back to the seed.

   ```bash
   curl -X POST http://localhost:8000/demo/reset
   ```

Without the flag the endpoint returns 404. Do not set it on a deployed instance, because anyone who can reach the backend could wipe the data.

## How it is built

**Backend** (`backend/app/`): `routers/` for the endpoints, `schemas/` for request and response models, `models/` for the tables, `services/` for the payment flow and receipt lookup, `legacy/` for the processor and its adapter, plus `db.py`, `config.py`, `errors.py` and `logging_config.py`. Schema changes go through Alembic.

**Frontend** (`frontend/src/`): one page in `App.tsx` with small components for each step. `api/client.ts` is the only code that calls `fetch`. Validation functions are in `validation.ts` and match the backend rules.

### Endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | `/activities` | upcoming trips |
| GET | `/activities/{id}` | one trip, 404 if missing |
| GET | `/parents` | the seeded parents |
| GET, POST | `/parents/{id}/students` | a parent's children; add one |
| GET | `/parents/{id}/registrations` | the parent's registrations with status, past trips included |
| POST | `/registrations` | register a child. 409 if already registered or the trip is past |
| POST | `/registrations/{id}/payments` | pay. 201 paid, 402 declined, 409 already paid or in progress, 422 invalid |
| GET | `/payments/{id}` | receipt for a successful payment, 404 otherwise |
| POST | `/demo/reset` | back to the seed, 204. 404 unless `DEMO_RESET_ENABLED` is set |

Every error has the same shape: `{ "code", "message", "field" }`. Each one is also logged to stdout.

### Payment flow

1. Validate the request body.
2. Mark any `pending` attempt on the registration that is older than 60 seconds as `failed`.
3. Reject with 409 if the registration is already paid or has a `pending` attempt.
4. Save a `pending` attempt (amount copied from the trip, last four digits only) and commit.
5. Call the legacy processor through the adapter, off the event loop.
6. On approval, mark the attempt `success` and the registration `paid` in one commit. On a decline, or if the processor throws, mark the attempt `failed` and return 402 so the parent can retry.

## Assumptions

- No login. Anyone can pick any parent. Each parent sees only their own children.
- Currency is NZD.
- The legacy processor is a mock. No real card is charged, and no real card data should be entered.
- There is one school. A child added in the app goes to the lowest-numbered school.
- Registering and paying are separate steps. An unpaid registration stays open with no expiry.

## Design decisions

- **Money is integer cents.** The adapter turns it into a `float` only for the legacy call, which rejects `Decimal`.
- **The server sets the amount.** It comes from the trip. A request that includes an `amount` is rejected.
- **No card data at rest or in logs.** Only the last four digits are stored. Card number, expiry and CVV are never logged, and validation errors do not echo them back.
- **Payment attempts are their own table.** One registration can have many attempts, so a decline can be retried. A partial unique index allows only one `pending` or `success` attempt per registration, which blocks a double payment even when two requests arrive together.
- **A stuck attempt recovers.** A `pending` attempt older than 60 seconds is marked `failed` the next time that registration is paid.
- **Attempt and registration change together.** `success` and `paid` are set in one commit, so they cannot disagree.
- **A late payment is allowed.** Registering for a past trip is rejected, but a parent can still pay for a registration they already made.
- **The backend is the authority on validation.** The frontend repeats the same rules for fast feedback.
- **A processor crash is treated like a decline.** The attempt is stored as `failed` and the parent sees a retryable message instead of a 500.
- **A receipt exists only for a success.** `GET /payments/{id}` returns 404 for a failed or pending attempt.
- **The seed adds only what is missing.** It runs on every start without duplicating rows.

## Known limits

- The trip date is set once, 30 days after the first start. A database kept longer than that no longer has an upcoming trip.
- If two payments for the same registration arrive together, the second gets "payment in progress" (409) even if the first has already finished. Nobody is charged twice.
- If the processor approves a payment and the database commit then fails, the attempt stays `pending` and is later marked `failed` with no transaction ID. There is no reconciliation. With the mock processor this cannot be reached in practice.
- Not deployed yet. The Render deploy is the last build step.

## Repository layout

- `backend/`, `frontend/`: the app.
- `docs/kindo-payments/`: the brief, the implementation plan and the legacy processor source.
- `docs/progress.md`: where the build stands and the decisions made on the way.
- `build-orchestration/`: prompt and build logs from the build sessions.
- `.claude/` and `CLAUDE.md`: the rules, hooks and skills used with Claude Code.
- `.devcontainer/`: the dev container and its firewall.
- `reusables/`, `examples/`: pieces left over from the project template. Not part of any build.

### Dev container notes

`docker-compose.yml` mounts a volume named `claude-credentials`, so Claude Code logins are shared by projects built from the same template. The firewall allows only GitHub, `api.anthropic.com`, npm, PyPI, `api.osv.dev`, `ui.shadcn.com` and the VS Code marketplace.
