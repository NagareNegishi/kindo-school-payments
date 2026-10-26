# Direction & deferrals

checked: 2026-10-26

Where things are heading and what is deliberately not being done. The "why" is the
durable part. Verify status against `docs/progress.md`, `docs/plans/`, and issues.

## Heading toward

Near-term, roughly in queue order:

- Browser check of the running app, run by the user -> `docs/plans/manual-check.md`
- Merge `feat/school-trip-payments` to `main` -> `docs/kindo-payments/impl.md`
- Deploy to Render by hand from the dashboard, then add the live URLs to the README -> `docs/kindo-payments/render-deploy.md`

## Deferred but real

- Render setup: not done; the repo side of Step 10 is closed -> `docs/kindo-payments/impl.md`
- A seeded trip date is set once, 30 days after the first start; a database kept longer has no upcoming trip -> `README.md`
- No reconciliation if the processor approves and the database commit then fails -> `README.md`

## Deliberately deferred (why)

- Login: a header dropdown stands in, to keep the first round small -> `docs/kindo-payments/product.md`
- Registration expiry, cancellation and refunds: out of the first round -> `docs/kindo-payments/product.md`
- Many schools: one school for now, so a new child goes to the lowest-numbered school -> `backend/app/routers/parents.py`

## Not in scope for the product

- Real card charging: the processor is a mock -> `README.md`
- Anything outside the implementation plan -> `CLAUDE.md` "Project rules"

## Where the live plans are

- `docs/kindo-payments/` = the plan docs for this app: product, implementation plan, impl steps, deploy guide -> `docs/kindo-payments/`
- `docs/plans/` = per-feature plan files; only the manual check lives there now -> `docs/plans/`
- This file indexes the live plans; it does not replace them.

## Notes for a reader

- `README.md` is the current description of the app; `CLAUDE.md` "Commands" still says the backend and frontend are not scaffolded and is out of date -> `CLAUDE.md`
