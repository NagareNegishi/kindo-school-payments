# Manual check

Browser check of the running app. The API-level run is already done (see "Already checked").

## Setup

Both servers are running from the last session. If not:

```bash
cd backend && uv run fastapi dev          # http://localhost:8000
cd frontend && npm run dev                # http://localhost:5173
```

Demo data is used up: Mia, Liam, Ella and Demo Child already have a paid registration from the API run. Add new children in the UI for each check below. Card for all payments: `4111 1111 1111 1111`, `12/30`, `123`.

## Checks

### Page and parent
- [ ] Heading, parent dropdown and the Zoo Trip card (title, date, location, $45.00, description) show. No Register button before a parent is picked.
- [ ] Pick Aroha Smith: Register button appears. Tom Wilson shows only Ella; Priya Patel shows only Demo Child.

### Child step
- [ ] Register a child, add a child with an empty name: error on blur and on submit, nothing is sent.
- [ ] A name over 100 characters is rejected.
- [ ] Add "Test One": it appears in the list and is selectable.
- [ ] A child already registered for this trip is marked and cannot be picked.

### Payment form
- [ ] Amount shows $45.00 and cannot be edited.
- [ ] Each field shows its error on blur (short card, `13/30`, `01/20` gives "Card has expired.", 2-digit CVV). Submitting empty shows all three.
- [ ] Card number with spaces is accepted.

### Paying
- [ ] While paying (about 1.5 s) the button is disabled with a spinner.
- [ ] Receipt shows transaction ID, amount, date, child, trip and last 4 digits only.
- [ ] After closing the receipt the child is gone from the unpaid list.
- [ ] Register a child, then Cancel the payment form: the child stays in the unpaid list with a Pay button, and Pay reopens the form.
- [ ] Decline (about 1 in 10 payments; use new children until one happens): banner with the processor message and Retry on the same form, input kept. Retry can succeed.
- [ ] Stop the backend, then pay: "Could not reach the server" banner with Retry, input kept. Start the backend and press Retry: it works.
- [ ] Submit, then switch parent within 1.5 s: no receipt appears under the other parent.

### Layout
- [ ] At about 375 px wide: no sideways scroll, inputs and buttons full width, nothing cut off.

### Privacy
- [ ] Browser console shows no card number, expiry or CVV.
- [ ] Backend terminal shows `payment attempt ... success` or `failed` lines and no card data.

## Already checked (API level, real servers and database)

- Register: 201, duplicate 409 `already_registered`.
- Bad card, expired card and a client-sent `amount`: 422 with the right field. Unknown registration: 404.
- Pay: 201 in about 1.8 s; paying again: 409 `already_paid`; two simultaneous payments: one 201, one 409 `payment_in_progress`.
- Receipt `GET /payments/{id}`: 200 for a success, 404 for an unknown id.
- CORS header for `http://localhost:5173`. Frontend builds and the dev server serves.
- Found and fixed: payment result lines never reached the log under `fastapi dev`.

Not seen live: a decline (random, covered by tests with `random` patched).

## Step 9 left

- [ ] README: setup, solution overview, assumptions, design decisions, known limits.
- [ ] `AI_WORKINGS.md`.
