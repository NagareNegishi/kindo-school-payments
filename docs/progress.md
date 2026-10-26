<!-- Update convention: read at session start; update after each major feature
     completes. One line per decision — state the decision, skip the reasoning. -->

Kindo school payments: FastAPI + React + Postgres app where a parent registers a child for a school trip and pays through a mock legacy processor. Backend done (Steps 1-5); frontend next.

## Key Decisions

### Backend
- Unknown `student_id` or `activity_id` on `POST /registrations` returns 404; the plan lists only 409 and 422.
- A repeated child name under one parent returns 409 `student_exists`; a new child goes to the first school.
- A declined or crashed payment returns 402 `payment_declined` in the shared error shape; the attempt is stored as `failed`.
- `POST /registrations/{id}/payments` and `GET /payments/{id}` both return the receipt data (`ReceiptOut`); `GET` returns 404 unless the payment succeeded.
- Endpoint tests run inside a rolled-back outer transaction (`tests/conftest.py`), so the dev database stays untouched.

## In Progress — pick up next session

- #3 feat: frontend for registering and paying
- #4 docs: README and AI_WORKINGS
- #5 chore: deploy to Render
