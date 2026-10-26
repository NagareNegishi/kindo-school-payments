---
paths:
  - "frontend/**"
---

- Every component works on mobile and desktop: mobile-first Tailwind classes, `sm:`/`md:` for wider screens, no fixed widths, full-width inputs and buttons on mobile.
- Validation rules match the backend: child name 1-100 trimmed, card 16 digits after removing spaces, expiry `MM/YY` not before the current month, CVV exactly 3 digits. The backend stays the authority.
- Show inline field errors on blur and on submit. Map backend field errors onto the matching input.
- While a payment runs, disable the submit button and show a spinner.
- On a decline, show a banner with the processor message and a retry on the same form. On a network or server error, show a banner with retry and keep the form input.
- Log unexpected errors with `console.error`; wrap the app in an error boundary with a fallback message.
- Read the backend URL from `VITE_API_URL`; call the API through one client module.
- Never log or persist card number, expiry, or CVV.
- Test logic only (validation functions, submit behaviour) with Vitest + React Testing Library. No layout or visual tests. Run tests, ESLint, and Prettier before declaring done.
