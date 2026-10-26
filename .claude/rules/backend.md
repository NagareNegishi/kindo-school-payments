---
paths:
  - "backend/**"
---

- Backend is the validation authority. Take the amount from the activity on the server, never from the client.
- Store money as integer cents. Send the legacy processor `amount` as `float` (`cost_cents / 100`), never `Decimal`; `card_number` as a 16-digit string with spaces stripped; `cvv` as a 3-digit string.
- Call the blocking `LegacyPaymentProcessor` from async code only through `run_in_threadpool`, and only through the adapter in `legacy/`.
- Reject an expiry before the current month; the processor does not check it.
- Never log or store the full card number, expiry, or CVV. Store `card_last4` only.
- Set `registration.status = paid` in the same database transaction that marks the attempt `success`.
- Follow the payment flow order in the plan: mark stale `pending` attempts `failed`, reject `paid` or `pending`, insert `pending` and commit, call the adapter, then record the result.
- Return every error as `{ "code", "message", "field" }` through the exception handlers, and log each one (validation, legacy declines and failures, database errors, unhandled exceptions with stack trace) to stdout.
- Schema changes go through Alembic. The seed inserts only missing rows.
- Layout: `routers/`, `schemas/`, `models/`, `services/`, `legacy/`, `db.py`, `config.py`.
- Tests patch `random` and `time.sleep` in the processor. Run pytest and ruff before declaring done.
