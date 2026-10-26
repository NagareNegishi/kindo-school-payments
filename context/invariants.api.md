# Backend invariants

checked: 2026-10-26

Rule categories that must hold on the backend, and where each is enforced or defined.
The citation is authoritative; the rule text is a hint, verify before relying. Lines
marked "gap" are rules the code states but does not fully enforce; lines marked
"closed" are gaps that have since been fixed.

## Data model gotchas

- Money is integer cents everywhere; only the adapter turns it into a float -> `backend/app/legacy/adapter.py`
- One live attempt per registration: a partial unique index on `pending` and `success` attempts -> `backend/app/models/payment_attempt.py`
- A child can register for a trip once, and a parent cannot have two children with the same name -> `backend/app/models/registration.py`, `backend/app/models/student.py`
- Only `card_last4` is stored; the full card number, expiry and CVV never reach a table -> `backend/app/models/payment_attempt.py`
- `registration.status = paid` is set in the same commit as the attempt's `success` -> `backend/app/services/payment.py`
- The seed inserts only missing rows, so restarts add no duplicates -> `backend/app/seed.py`
- Schema changes go through an Alembic migration, never by editing tables by hand -> `backend/migrations/versions/`

## Validation

- Card number is 16 digits after spaces are removed, CVV is exactly 3 digits, expiry is `MM/YY` and not before the current month -> `backend/app/schemas/payment.py`
- Child name is trimmed and 1-100 characters -> `backend/app/schemas/student.py`
- Request bodies reject unknown fields, so a client cannot send an amount -> `backend/app/schemas/payment.py`
- The amount always comes from the activity on the server -> `backend/app/services/payment.py`
- The processor does not check expiry, so the backend must -> `backend/app/schemas/payment.py`

## Payment flow

- Order: load, mark stale `pending` attempts `failed`, reject if paid or pending, insert `pending` and commit, call the adapter, record the result -> `backend/app/services/payment.py`
- A `pending` attempt older than 60 seconds counts as stale -> `backend/app/services/payment.py`
- A registration for a past trip cannot be created, but can still be paid -> `backend/app/routers/registrations.py`
- A processor crash is recorded as a `failed` attempt, never left `pending` -> `backend/app/services/payment.py`
- Only the adapter may call the processor, and the processor file is not edited -> `backend/app/legacy/adapter.py`, `backend/app/legacy/processor.py`

## Fail-fast config

- `DATABASE_URL` has no default, so the app fails at import without it -> `backend/app/config.py`
- A plain `postgresql://` or `postgres://` URL is converted to `postgresql+asyncpg://` -> `backend/app/config.py`

## Error responses

- Every error is `{ code, message, field }`: validation errors, `HTTPException`s and unhandled exceptions all pass through the handlers -> `backend/app/errors.py`
- Validation errors report the first error only and never echo the input, which can hold card data -> `backend/app/errors.py`
- Unhandled exceptions return a generic 500 message and log the stack trace -> `backend/app/errors.py`
- Status codes: 404 unknown id, 409 duplicate or already paid or in progress, 402 declined payment, 422 invalid input -> `backend/app/routers/`, `backend/app/services/payment.py`
- No error message or log line may contain the card number, expiry or CVV -> `backend/tests/test_errors.py`, `backend/tests/test_payment_endpoints.py`

## Gaps

- gap: the add-child request cannot pick a school; the first school is used -> `backend/app/routers/parents.py`
- gap: there is no login, so any caller can read or pay for any parent's registrations; the dropdown is a demo stand-in -> `docs/kindo-payments/Kindo School Payments – Implementation Plan.md`
