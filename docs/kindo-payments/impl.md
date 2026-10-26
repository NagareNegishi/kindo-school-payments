# Implementation plan: kindo-payments

## Maturity
lowest: 🤖 ai-audited
🌱 idea 0 · 🤖 ai-audited 12 · 👤 human-ok 0 · ✅ settled 0

## Status

| Step | State | Note |
|---|---|---|
| 1 | done | #1 |
| 2 | done | #2 |
| 3 | done | #2 |
| 4 | done | #2 |
| 5 | planned | #2 |
| 6 | planned | #3 |
| 7 | planned | #3 |
| 8 | planned | #3 |
| 9 | planned | #4 |
| 10 | planned | #5 |

## Overview
🤖 ai-audited(sonnet-5.5) · ❔ unverified (not checked)

Backend first, then frontend, then docs and deploy, in the order of the Implementation Plan's build order. Each step ships its code and its tests together, and is committed once it works. Before a step is done, tests, ruff (backend) and ESLint plus Prettier (frontend) pass. The legacy processor is called only through an adapter. While building, keep notes for `AI_WORKINGS.md`: key prompts, each case where output was wrong with how it was caught and the fix, and code written or rewritten by hand and why. The Implementation Plan holds the detail for every step.

## Risks & unknowns
🤖 ai-audited(sonnet-5.5) · ❔ unverified (not checked)

## Steps

### Step 1: Set up the environment and repo skeleton
🤖 ai-audited(sonnet-5.5) · ❔ unverified (not checked)

- [x] Set `POSTGRES_DB=kindo` in `.devcontainer/.env`.
- [x] Add `.devcontainer/.env` to `.gitignore`.
- [x] Remove `version` from `docker-compose.yml`.
- [x] Rebuild the dev container; check Postgres is reachable through `DATABASE_URL`, `uv` runs, and PyPI and npm installs work (if rejected, rerun `sudo /usr/local/bin/project-firewall.sh`).
- [x] Create `backend/` with `uv`, ruff and pytest; an empty test run passes.
- [x] Initialise Alembic with no migrations.
- [x] Create `frontend/` with Vite, React, Tailwind, ESLint, Prettier and Vitest; an empty test run passes.
- [x] Add `.env.example` files for backend and frontend listing every variable.
- [x] Add an empty `AI_WORKINGS.md`.

### Step 2: Add config, models, migration and seed
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [x] `config.py`: read `DATABASE_URL`, convert `postgresql://` to `postgresql+asyncpg://`, set the frontend origin for CORS.
- [x] `db.py`: async engine and session.
- [x] `models/`: the six tables with integer-cent money, unique constraints, and the partial unique index on `payment_attempt`.
- [x] One Alembic migration for the schema.
- [x] Seed: one school, one trip, three parents (two children, one child, none), inserting only missing rows.
- [x] Run migrations and the seed on backend start.
- [x] Test: seed run twice adds no duplicate rows.

### Step 3: Add the legacy processor and adapter
🤖 ai-audited(sonnet-5.5) · ❔ unverified (not checked)

- [x] Include `LegacyPaymentProcessor` unchanged in its own module under `legacy/`.
- [x] Adapter maps each field to the type the processor expects: `amount` as float from `cost_cents / 100`, card number as 16 digits with spaces stripped, `school_id` and `activity_id` as strings.
- [x] Callers use `run_in_threadpool`, because the processor blocks for 1.5 s.
- [x] Tests patch `random` and `time.sleep`; the adapter test checks every field type.

### Step 4: Add validation schemas and error handling
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [x] Schemas for child name: required, trimmed, 1-100 chars.
- [x] Schemas for card number (16 digits after removing spaces), expiry (`MM/YY`, month 01-12, not before the current month) and CVV (exactly 3 digits).
- [x] Never take the amount from the client.
- [x] Exception handlers for validation errors, `HTTPException` and unhandled exceptions, each returning `{ code, message, field }` and logging the error.
- [x] Tests: each rule rejects bad input with the right field error; every error type returns the shared shape.

### Step 5: Add endpoints, payment service and logging
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] Read endpoints: `GET /activities` (upcoming only), `GET /activities/{id}`, `GET /parents`.
- [ ] Student endpoints: `GET` and `POST /parents/{id}/students`. Test: only the selected parent's children are returned.
- [ ] `POST /registrations` (409 for duplicate or past activity) and `GET /parents/{id}/registrations`. Tests: duplicate 409; past activity hidden from the list and registration 409.
- [ ] Payment service in `services/`: validate, mark `pending` attempts older than 60 s `failed`, reject if paid or pending, insert `pending` and commit.
- [ ] Payment service: call the adapter, then record `success` (attempt and registration `paid` in one transaction) or `failed`.
- [ ] `POST /registrations/{id}/payments` (201, 402 declined, 409, 422; allowed after the activity date) and `GET /payments/{id}`.
- [ ] Tests: success; decline then retry; stale pending recovered; second payment 409; payment for a past-activity registration accepted.
- [ ] Logging to stdout for every error and every payment attempt result; store only `card_last4`. Test: errors are logged without card data.

### Step 6: Add the API client and trip card
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] Mobile-first layout with `sm:`/`md:` breakpoints.
- [ ] Read `VITE_API_URL` at build time.
- [ ] One API client module for all calls.
- [ ] Trip list of upcoming trips (title, date, location, cost, description).
- [ ] Empty state when there are no trips.

### Step 7: Add parent dropdown, child picker and payment form
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] Header parent dropdown.
- [ ] The selected parent's unpaid registrations above the trip list (past trips included), each with a Pay button.
- [ ] Child picker with an add-child form; children already registered for the trip are marked and not selectable.
- [ ] Validation functions for each field, matching the backend rules. Tests for each.
- [ ] Payment form: card number, expiry, CVV; the amount shown and not editable; inline errors on blur and on submit.

### Step 8: Add loading, error banners, retry and receipt
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] Submit disabled with a spinner while the payment runs.
- [ ] Decline banner with the processor message and a retry button on the same form.
- [ ] Network or server error banner with retry, form input kept.
- [ ] Map backend field errors onto the matching input.
- [ ] `console.error` for unexpected errors and a React error boundary fallback.
- [ ] Receipt: transaction ID, amount, date, child, trip, card last 4.
- [ ] Tests: submit disabled while pending; error mapped to the right field or banner.

### Step 9: Final pass on README and AI_WORKINGS
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] README: setup, solution overview, assumptions (no login, NZD, mock processor) and design decisions.
- [ ] README: link to `AI_WORKINGS.md`.
- [ ] `AI_WORKINGS.md`: tools used and for what, key prompts, `CLAUDE.md` committed.
- [ ] `AI_WORKINGS.md`: at least one AI mistake with how it was noticed and the fix, and what was written, rewritten or rejected by hand and why.
- [ ] Laptop ready to run the app and walk through the code at the demo.

### Step 10: Deploy to Render
🤖 ai-audited(sonnet-5.5) · ❔ unverified (net-new)

- [ ] Free Postgres, free web service for the backend, static site for the frontend, auto-deployed from GitHub on push to `main`.
- [ ] Set `VITE_API_URL` and the CORS origin; use `.env.example` for the Render variables.
- [ ] Add the live URL to the README.
- [ ] Open the backend URL before the demo to wake it; the free Postgres expires 30 days after creation.
