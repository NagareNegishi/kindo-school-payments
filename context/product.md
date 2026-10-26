# Product

checked: 2026-10-26

Purpose and audience. Claims here may lag; verify against `docs/kindo-payments/product.md`
and `docs/progress.md`. The citation is authoritative.

## What Kindo School Payments is

- A web app where a parent registers a child for a school trip, pays by card through an online form and gets a receipt -> `docs/kindo-payments/product.md`
- Payments go to a mock legacy processor behind an adapter; no real card is charged -> `backend/app/legacy/adapter.py`

## Who it serves

- Parents of school children; the demo stands in for login with three seeded parents picked from a header dropdown -> `backend/app/seed.py`, `frontend/src/components/ParentSelect.tsx`
- Not served: school staff, admins, anyone who needs real login -> `docs/kindo-payments/product.md`

## What "done well" means

- The server sets the amount; the client never sends one -> `backend/app/schemas/payment.py`
- Only the last four card digits are stored, and card data is never logged -> `backend/app/models/payment_attempt.py`
- A payment can be retried after a decline without retyping the form -> `frontend/src/components/PaymentForm.tsx`
- Every backend error has the same `{ code, message, field }` shape -> `backend/app/errors.py`
- Every screen works on mobile and desktop -> `.claude/rules/frontend.md`

## Product boundaries

Deliberate non-goals (the "why" is in the plan docs, not here):

- No login -> `docs/kindo-payments/product.md`
- No expiry of unpaid registrations -> `docs/kindo-payments/product.md`
- No cancellation or refunds -> `docs/kindo-payments/product.md`
