# Kindo School Payments - Implementation Plan

## Scope

A parent pays for one school field trip. Time budget: 2–4 hours.

Parent flow:

1. View trip details (date, cost, location).
2. Register their child.
3. Pay through an online form.
4. See a payment confirmation.

## Requirements

| Priority | Requirement |
| --- | --- |
| Must | Backend in Python + FastAPI, frontend in React + Tailwind, relational database |
| Must | Working payment flow, frontend to backend |
| Must | Integration with the legacy payment API, success and failure handled |
| Must | Form validation on frontend and backend |
| Must | Error handling and user feedback |
| Must | Error logging: every backend error logged |
| Must | Unit tests for logic, written with each feature (no layout tests) |
| Must | Every component responsive on mobile and desktop |
| Must | Transaction records stored |
| Must | `AI_WORKINGS.md` |
| Nice | Loading state during payment |
| Nice | Receipt |
| Bonus | Deployed to a free host |

Submission:

- GitHub repo with regular commits.
- README: setup, solution overview, assumptions and design decisions, link to `AI_WORKINGS.md`.
- `AI_WORKINGS.md`: tools used and for what; key prompts and agent config files (`CLAUDE.md`) committed; at least one case where the AI went wrong, how it was noticed, what was done; what was written, rewritten or rejected by hand and why.
- Laptop ready to run the app and walk through code at the demo.

## Environment

Dev container via Docker Compose, project name `kindo`.

| Part | Setup |
| --- | --- |
| App container | Python 3.14 (Debian trixie), uv 0.13.5, Node feature, GitHub CLI, Claude Code |
| Database | `postgres:14.3`, driver asyncpg, database `kindo` |
| Ports | 8000 backend, 5173 frontend, 5432 Postgres |
| Firewall | Outbound allowlist: GitHub, npm, PyPI, `api.anthropic.com`, `ui.shadcn.com`, VS Code marketplace |
| Timezone | Pacific/Auckland |

Fixes before building:

- [ ] Set `POSTGRES_DB=kindo` in `.devcontainer/.env` so Postgres creates the `kindo` database.
- [ ] Add `.devcontainer/.env` to `.gitignore`.
- [ ] Remove `version: '3.8'` from `docker-compose.yml`.

Operating notes:

- Firewall resolves allowed IPs once at start. If npm or uv installs get rejected, rerun `sudo /usr/local/bin/project-firewall.sh`.

## Data model

Six tables. EER subtypes are flattened: `activity.type` holds the subtype, trip-only fields are nullable. Money is stored as integer cents.

| Table | Columns | Constraints |
| --- | --- | --- |
| `school` | id, name |  |
| `parent` | id, name, email | email unique |
| `student` | id, name, school\_id, parent\_id | references school, parent |
| `activity` | id, school\_id, type, title, date, location (nullable), cost\_cents, description (nullable) | type enum: `trip` |
| `registration` | id, student\_id, activity\_id, status, created\_at | unique (student\_id, activity\_id); status: `registered`, `paid` |
| `payment_attempt` | id, registration\_id, amount\_cents, status, legacy\_transaction\_id (nullable), error\_message (nullable), card\_last4, created\_at, updated\_at | status: `pending`, `success`, `failed`; partial unique index on registration\_id where status in (`pending`, `success`) |

Rules:

- One registration has many payment attempts (retries after a decline).
- `amount_cents` is copied from the activity cost when the attempt is created.
- Never store the full card number, expiry or CVV. Store `card_last4` only.
- Set `registration.status = paid` in the same database transaction that marks the attempt `success`.
- Students are created under the selected parent. A child already registered for the activity is rejected by the unique constraint.
- Migrations through Alembic. Seed data as in Assumptions and scope; the seed inserts only missing rows, so restarts add no duplicates.

## Legacy payment API

Include `LegacyPaymentProcessor` from the brief unchanged, in its own module. Call it only through an adapter.

| Field | Type sent | Source |
| --- | --- | --- |
| `student_name` | str | student.name |
| `parent_name` | str | parent.name |
| `amount` | float | `cost_cents / 100` |
| `card_number` | str, 16 digits (spaces stripped) | payment form |
| `expiry_date` | str, `MM/YY` | payment form |
| `cvv` | str, 3 digits | payment form |
| `school_id` | str | `str(school.id)` |
| `activity_id` | str | `str(activity.id)` |

Behaviour to handle:

- Returns `PaymentResponse(success, transaction_id, error_message)`.
- Blocks for 1.5 s (`time.sleep`). Call through `run_in_threadpool` from async endpoints.
- Declines 10% of valid payments at random. Record a `failed` attempt and let the parent retry.
- Does not check that the expiry date is in the future. The backend checks it.
- Rejects `Decimal` amounts. Send `float`.
- Accepts 3-digit CVV only.

## Backend

| Method | Path | Purpose | Responses |
| --- | --- | --- | --- |
| GET | `/activities` | Upcoming activities only (date today or later) | 200 |
| GET | `/activities/{id}` | Trip details | 200, 404 |
| GET | `/parents` | Seeded parents for the header dropdown | 200 |
| GET | `/parents/{id}/students` | Children of one parent | 200, 404 |
| POST | `/parents/{id}/students` | Add a child | 201, 404, 422 |
| GET | `/parents/{id}/registrations` | Registrations of the parent's children, with status, past trips included | 200, 404 |
| POST | `/registrations` | Register a child for an activity (`student_id`, `activity_id`) | 201, 409 already registered or activity past, 422 |
| POST | `/registrations/{id}/payments` | Pay for a registration (allowed after the activity date) | 201 success, 402 declined, 409 already paid or in progress, 422 |
| GET | `/payments/{id}` | Receipt data | 200, 404 |

Payment flow:

1. Validate request (Pydantic).
2. Mark any `pending` attempt older than 60 s as `failed` (recovery after a crash mid-payment).
3. Reject if registration is `paid` or has a `pending` attempt.
4. Insert `payment_attempt` as `pending`, commit.
5. Call the legacy adapter.
6. On success: set attempt `success` with `legacy_transaction_id`, set registration `paid`, commit.
7. On failure: set attempt `failed` with `error_message`, commit.
8. Return one error shape for every error: `{ "code": str, "message": str, "field": str | null }`. Exception handlers for validation errors, `HTTPException` and unhandled exceptions produce it and log the error.

Logging: Python `logging` to stdout (Render captures it). Log every error: validation rejections, legacy declines and failures, database errors, unhandled exceptions with stack trace. Log every payment attempt result. Never log card number, expiry or CVV.

Structure: `routers/`, `schemas/`, `models/`, `services/` (payment service), `legacy/` (processor + adapter), `db.py`, `config.py`.

## Frontend

Vite + React + Tailwind. One page: a header plus four steps. Every component works on mobile and desktop: mobile-first classes, \`sm:\`/\`md:\` breakpoints for wider screens, no fixed widths, full-width inputs and buttons on mobile.

1. Header (always visible): parent dropdown, the demo stand-in for login.
2. Trip list: upcoming trips only (title, date, location, cost, description); empty state when none. Above it, the selected parent's unpaid registrations (past trips included), each with a Pay button.
3. Child: pick one of the selected parent's children, or add a new child. Children already registered for the trip are marked and not selectable.
4. Payment form: card number, expiry, CVV. Amount shown, not editable.
5. Confirmation: receipt with transaction ID, amount, date, child, trip, card last 4.

Behaviour:

- Inline field errors on blur and on submit.
- Submit button disabled and spinner shown while the payment runs (about 1.5 s).
- Decline: banner with the processor message and a retry button on the same form.
- Network or server error: banner with a retry option. Form input is kept.
- Backend field errors are mapped onto the matching input.
- Unexpected errors logged with `console.error`; a React error boundary shows a fallback message.

## Validation rules

Same rules on frontend and backend. Backend is the authority.

| Field | Rule |
| --- | --- |
| Child name | Required, trimmed, 1–100 chars |
| Card number | 16 digits after removing spaces |
| Expiry | `MM/YY`, month 01–12, not before the current month |
| CVV (Card Verification Value: the 3-digit security code on the card) | Exactly 3 digits |
| Amount | Taken from the activity on the server, never from the client |

## Testing

Tests are written with the code they cover, in the same commit. Logic only; no page layout or visual tests.

Backend (pytest), legacy `random` and `time.sleep` patched:

- Adapter maps every field to the type the legacy API expects.
- Each validation rule rejects bad input with the right field error.
- Every error type returns the shared error shape.
- Students endpoint returns only the selected parent's children.
- Past activity: hidden from `GET /activities`; registration returns 409; payment for an existing registration is accepted.
- Success path: attempt `success`, registration `paid`.
- Decline path: attempt `failed`, registration stays `registered`, retry allowed.
- Stale `pending` attempt is marked `failed` and retry is allowed.
- Second payment on a paid registration returns 409.
- Duplicate registration returns 409.
- Seed run twice adds no duplicate rows.
- Errors are logged without card data.

Frontend (Vitest + React Testing Library):

- Validation functions for each field.
- Payment submit: disabled while pending, error mapped to the right field or banner.

## AI agent rules

Goes into `CLAUDE.md` at the repo root.

- Read this plan before any task. Do not add features outside it.
- Do not edit `legacy/` processor code.
- One small task per prompt. Commit after each working step with a clear message.
- Verify library usage against current official docs, not memory.
- Never log or store full card number, expiry or CVV.
- Write tests with the code they cover, in the same commit. Run tests, ruff (backend) and ESLint + Prettier (frontend) before declaring a task done.
- Ask when a requirement is unclear instead of guessing.

Logging for `AI_WORKINGS.md`, kept while building:

- Key prompts.
- Each case where output was wrong, how it was caught, the fix.
- Code written or rewritten by hand, and why.

## Deployment

Render free tier, auto-deployed from GitHub on push to `main`.

| Part | Render service |
| --- | --- |
| Frontend | Static site |
| Backend | Free web service |
| Database | Free Render Postgres |

Free tier limits ([Render docs](https://render.com/docs/free)):

- Web service spins down after 15 minutes without traffic. The next request waits for a cold start.
- Free Postgres expires 30 days after creation, then a 14-day grace period before deletion. No backups.
- 750 free instance hours per workspace per month.

Open the backend URL before the demo to wake it.

Config:

- Frontend reads the backend URL from `VITE_API_URL` at build time.
- Backend allows the frontend origin in CORS (Cross-Origin Resource Sharing: the browser rule that lets one site call another's API).
- Render provides a `postgresql://` URL; `config.py` converts it to `postgresql+asyncpg://` for SQLAlchemy async.
- Migrations and idempotent seed run on backend start.
- `.env.example` lists every variable, used by the README setup and Render.

## Build order

Each step ships its code and its tests together.

- [ ] Environment fixes; repo skeleton with ruff, ESLint and Prettier; `CLAUDE.md`; empty `AI_WORKINGS.md`
- [ ] Backend: models, Alembic migration, seed data
- [ ] Backend: legacy processor + adapter, with adapter tests
- [ ] Backend: validation schemas, with validation tests
- [ ] Backend: endpoints, payment service, logging, with flow tests (success, decline, 409 cases)
- [ ] Frontend: Vite + Tailwind setup, trip card
- [ ] Frontend: parent dropdown, child picker and add-child form, payment form, with validation tests
- [ ] Frontend: loading, error banners, retry, receipt, with submit tests
- [ ] README and `AI_WORKINGS.md` final pass
- [ ] Deploy to Render

## Assumptions and scope

Assumptions, documented in the README:

- No login. A header dropdown selects a seeded parent as a demo stand-in; each parent sees only their own children.
- Currency NZD.
- The legacy processor is a mock; no real card data is used.

First round (make it work first):

- Seeded: one school, one trip, three parents (one with two children, one with one, one with none).
- One parent per student (`student.parent_id`).
- Registration and payment are separate steps. An unpaid registration stays `registered` with no expiry.

Next, high priority (each ships with its tests):

1. Multiple schools and multiple trips. Tests: trips listed and fetched per school; registration and payment scoped to the right school and trip.
2. Parent and student many-to-many through a link table (`student_guardian`), no limit on parents per student. Tests: one student with several parents; one parent with several students; either parent can pay; a registration is paid only once across parents.

Later:

- Unpaid registration expiry based on the activity date.
- Cancellation and refunds.
