# Product plan: kindo-payments

## Maturity
lowest: 👤 human-ok
🌱 idea 0 · 🤖 ai-audited 0 · 👤 human-ok 11 · ✅ settled 0

## about
👤 human-ok

A web app where a parent registers a child for a school field trip, pays through an online form, and gets a receipt. Payments go to a mock legacy processor behind an adapter.

## problem / motivation
👤 human-ok

A parent pays for one school field trip. Time budget: 2-4 hours.

## goal
👤 human-ok

A parent can view a trip, register their child, pay, and see a confirmation, with every payment attempt stored as a transaction record.

## audience
👤 human-ok

Parents of school children. The demo uses three seeded parents chosen from a header dropdown, standing in for login.

## requirements
👤 human-ok

- When a parent opens the app, the system shall show the upcoming trips (title, date, location, cost, description).
- When a parent selects a trip, the system shall let them pick one of their own children or add a new child.
- When a child is already registered for the trip, the system shall mark the child and reject a second registration with 409.
- When a parent submits the payment form, the system shall validate card number (16 digits), expiry (`MM/YY`, not before the current month) and CVV (3 digits) on the frontend and the backend.
- When a payment is submitted, the system shall take the amount from the activity on the server, never from the client.
- When a payment is submitted, the system shall store a `pending` attempt, call the legacy processor through the adapter, then record `success` or `failed`.
- When the processor returns success, the system shall mark the attempt `success` and the registration `paid` in one database transaction.
- When the processor declines, the system shall record a `failed` attempt, keep the registration `registered`, and let the parent retry on the same form.
- When a registration is already `paid` or has a `pending` attempt, the system shall reject a payment with 409.
- When a `pending` attempt is older than 60 s, the system shall mark it `failed` before the next payment is checked.
- When a payment is running, the system shall disable the submit button and show a spinner.
- When a payment succeeds, the system shall show a receipt with transaction ID, amount, date, child, trip and card last 4.
- When a parent has unpaid registrations, the system shall list them above the trip list with a Pay button, past trips included.
- When a trip date is in the past, the system shall hide it from the trip list and reject new registrations for it with 409, but accept payment for an existing registration.
- When any backend error occurs, the system shall log it and return `{ "code", "message", "field" }`.
- When a payment attempt finishes, the system shall log its result.
- When a child name is submitted, the system shall require it, trim it, and accept 1-100 characters.
- When an unexpected frontend error occurs, the system shall log it with `console.error` and show a fallback message through a React error boundary.
- When the backend returns a field error, the system shall show it on the matching input.
- When a network or server error occurs, the system shall show a banner with a retry option and keep the form input.
- When the app starts, the system shall run migrations and an idempotent seed that adds only missing rows.
- The system shall store only `card_last4`, never the full card number, expiry or CVV, and shall not log them.
- The system shall be usable on mobile and desktop for every component.
- Tests shall ship in the same commit as the code they cover; no layout or visual tests.
- The repo shall include a README (setup, solution overview, assumptions and design decisions, link to `AI_WORKINGS.md`) and `AI_WORKINGS.md`.

## stack
👤 human-ok

- Backend: Python 3.14, FastAPI, SQLAlchemy async with asyncpg, Alembic, uv.
- Frontend: React, Vite, Tailwind.
- Database: PostgreSQL 14.3.
- Tests: pytest; Vitest and React Testing Library.
- Lint: ruff; ESLint and Prettier.
- Dev container via Docker Compose.
- Deploy (bonus): Render free tier (static site, web service, Postgres).

## target device / platform
👤 human-ok

Web, responsive: mobile-first with `sm:`/`md:` breakpoints, one page.

## constraints
👤 human-ok

- Time budget 2-4 hours.
- `LegacyPaymentProcessor` is included unchanged and called only through the adapter.
- The processor blocks for 1.5 s, declines 10% of valid payments at random, does not check expiry, rejects `Decimal` amounts, and accepts a 3-digit CVV only.
- Money is stored as integer cents; currency NZD.
- The backend is the authority for validation.
- No real card data is used.
- Render free tier: web service spins down after 15 minutes idle, free Postgres expires after 30 days.

## non-goals
👤 human-ok

- Login. A header dropdown selects a seeded parent as a demo stand-in.
- Unpaid registration expiry based on the activity date.
- Cancellation and refunds.

## decisions
👤 human-ok

- **Plan over brief:** the Kindo School Payments Implementation Plan always wins over `Tech_Challenge.md`. Why: the plan is settled.
- **Build from the impl doc:** during the build, follow the `plan-impl` doc. Where it would violate the Implementation Plan, the Implementation Plan wins.
- **Registration and payment are separate steps:** an unpaid registration stays `registered` with no expiry. Why: first round, make it work first.
- **One parent per student:** `student.parent_id`. Why: first round, make it work first.
- **Flattened subtypes:** `activity.type` holds the subtype, trip-only fields are nullable.
- **Many payment attempts per registration:** Why: retries after a decline.

## open questions
👤 human-ok
