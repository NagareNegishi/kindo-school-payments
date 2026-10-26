# Frontend invariants

checked: 2026-10-26

Rule categories that must hold on the frontend, and where each is enforced or defined.
The citation is authoritative; the rule text is a hint, verify before relying. Lines
marked "gap" are rules stated somewhere but not mechanically enforced; lines marked
"closed" are gaps that have since been fixed.

## Data flow

- One page: `App` holds the selected parent, loaded data and the register and pay state, and passes it down to small components -> `frontend/src/App.tsx`
- Data loaded for a parent is tagged with that parent's id, so a slow response never shows under another parent -> `frontend/src/App.tsx`
- Switching parent closes any open picker, payment form and receipt -> `frontend/src/App.tsx`
- A payment that finishes after a parent switch shows no receipt -> `frontend/src/App.tsx`

## API contract consumption

- `api/client.ts` is the only code that calls `fetch`; the base URL is `VITE_API_URL` at build time -> `frontend/src/api/client.ts`
- Every failed response, whatever its body, becomes an `ApiError` with status, code and field -> `frontend/src/api/client.ts`
- A payment request carries only the card details; the amount is never sent -> `frontend/src/api/client.ts`
- Response types are written by hand to match the backend schemas; nothing generates them. Gap -> `frontend/src/api/client.ts`

## Validation

- Child name 1-100 trimmed; card 16 digits after removing spaces; expiry `MM/YY` not before the current month; CVV exactly 3 digits -> `frontend/src/validation.ts`
- Errors show on blur and on submit; an invalid form sends nothing -> `frontend/src/components/PaymentForm.tsx`, `frontend/src/components/ChildPicker.tsx`
- The backend stays the authority; a backend field error lands on the matching input and clears when that input is edited -> `frontend/src/paymentErrors.ts`, `frontend/src/components/PaymentForm.tsx`

## Payment form

- The amount is shown and has no input -> `frontend/src/components/PaymentForm.tsx`
- While a payment runs the submit button is disabled with a spinner, and a second submit in the same tick is ignored by a ref -> `frontend/src/components/PaymentForm.tsx`
- The form remounts per registration, so typed card details never carry over -> `frontend/src/App.tsx`
- A decline, network error or server error shows a banner with Retry on the same form, input kept; other client errors show no Retry -> `frontend/src/paymentErrors.ts`

## Errors and logging

- Unexpected errors go to `console.error`; a render error shows a fallback through the error boundary -> `frontend/src/components/ErrorBoundary.tsx`, `frontend/src/main.tsx`
- A failed load of parents or a parent's data shows an alert with Try again -> `frontend/src/components/LoadError.tsx`
- A failed refresh after a successful payment is logged and never shown as a payment error -> `frontend/src/App.tsx`

## Privacy

- Card number, expiry and CVV are never logged or persisted; they live in component state until submit -> `frontend/src/components/PaymentForm.tsx`

## Layout

- Mobile-first Tailwind classes with `sm:` for wider screens; no layout or visual tests -> `.claude/rules/frontend.md`

## Types

- TypeScript with `verbatimModuleSyntax` and `erasableSyntaxOnly`; ESLint with Prettier last -> `frontend/tsconfig.app.json`, `frontend/eslint.config.js`
