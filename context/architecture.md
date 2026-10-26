# Architecture

checked: 2026-10-26

The parts and the seams between them. Every line ends in a citation; the citation is
the truth, the line is a hint. Verify before relying.

CLAUDE.md "Architecture" is the prose companion but lags the code -> CLAUDE.md
"Architecture", `backend/app/main.py`

## Parts

### Backend - `backend/`

- HTTP layer: one router per resource, no business logic beyond lookups and mapping results to status codes -> `backend/app/routers/`
- Payment flow: the only place that runs a payment, in the plan's order, split into one helper per step -> `backend/app/services/payment.py`
- Receipt lookup: shared by the payment POST and the receipt GET -> `backend/app/services/receipt.py`
- Request and response shapes, and the card validation rules -> `backend/app/schemas/`
- Tables: six models, money as integer cents -> `backend/app/models/`
- Legacy processor, unchanged, plus the adapter that is its only caller -> `backend/app/legacy/`
- Settings, async engine and per-request session -> `backend/app/config.py`, `backend/app/db.py`
- Idempotent demo seed -> `backend/app/seed.py`

### Frontend - `frontend/`

- One page that owns the selected parent, loaded data and the register and pay state -> `frontend/src/App.tsx`
- Small components, one per step: trip list and card, parent dropdown, child picker, unpaid list, payment form, receipt, load error -> `frontend/src/components/`
- API client: the only code that calls `fetch`, with the response types and `ApiError` -> `frontend/src/api/client.ts`
- Pure helpers: field validation, payment error mapping, money and date formatting -> `frontend/src/validation.ts`, `frontend/src/paymentErrors.ts`, `frontend/src/format.ts`
- Error boundary around the app -> `frontend/src/main.tsx`

### Database - PostgreSQL 14.3, SQLAlchemy async with asyncpg

- Schema changes go through Alembic; one migration creates all six tables -> `backend/migrations/versions/`
- Migrations and the seed run on every backend start -> `backend/app/main.py`

### Tests - `backend/tests/`

- Endpoint tests run inside an outer transaction that is rolled back, so commits in the code under test never reach the dev database -> `backend/tests/conftest.py`
- Legacy `random` and `time.sleep` are patched in every test that reaches the processor -> `backend/tests/test_payment_service.py`, `backend/tests/test_legacy_adapter.py`

## Seams

Each interface between parts and to the outside.

- Legacy processor: blocking call made only through the adapter, off the event loop with `run_in_threadpool` -> `backend/app/legacy/adapter.py`
- Database session: one session per request, injected with `get_session`; tests replace it -> `backend/app/db.py`, `backend/tests/conftest.py`
- Error shape: every error leaves the API as `{ code, message, field }` through three handlers -> `backend/app/errors.py`
- Frontend to backend: CORS allows the frontend origin from settings -> `backend/app/main.py`, `backend/app/config.py`
- Backend URL: the frontend reads `VITE_API_URL` at build time -> `frontend/src/api/client.ts`
- Payment error to screen: a pure function turns a failed payment into a banner or field messages -> `frontend/src/paymentErrors.ts`

## What crosses each seam

- A declined or crashed payment is stored as a `failed` attempt, and the endpoint turns it into a 402 `payment_declined` -> `backend/app/routers/registrations.py`
- A payment POST and the receipt GET return the same `ReceiptOut` shape, including a failed attempt's `status` -> `backend/app/schemas/receipt.py`
- The adapter receives cost in cents and sends the processor a float amount -> `backend/app/legacy/adapter.py`
- Routers raise errors with `api_error`; plain `HTTPException`s are reshaped by the handler -> `backend/app/errors.py`

## Cross-cutting

- Start-up order: run migrations in a thread, seed, commit, then serve -> `backend/app/main.py`
- Config fails fast: the app does not start without `DATABASE_URL`, and a plain `postgresql://` URL is converted to the asyncpg form -> `backend/app/config.py`
- Logging goes to stdout through the standard `logging` module; errors and payment results are logged without card data -> `backend/app/errors.py`, `backend/app/services/payment.py`

## Infra

- Dev container with Postgres as a second service and an outbound firewall -> `.devcontainer/`
- Deploy target is Render, set up by hand from the dashboard; not done yet -> `docs/kindo-payments/render-deploy.md`

## Weak or missing seams

- A new child is attached to the first school, because the add-child request has no school field and the first round has one school -> `backend/app/routers/parents.py`
- The payment flow checks for a live attempt, then inserts; a race between two requests is caught only by the unique index -> `backend/app/services/payment.py`, `backend/app/models/payment_attempt.py`
- The browser check has not been run, so no cross-origin call has been exercised outside tests and API-level runs -> `docs/plans/manual-check.md`
- Frontend response types are written by hand and can drift from the backend schemas -> `frontend/src/api/client.ts`, `backend/app/schemas/`
