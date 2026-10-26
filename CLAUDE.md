**Skill work**: before polishing or adding a skill in `.claude/skills/`, read
`docs/skills/new-skills.md` (authoring and polish guide).

**Config work**: changes to `.claude/settings.json` (permissions, hooks) must cite
the relevant code.claude.com docs and get user sign-off before writing.

**Attribution**: never add Claude as author, co-author (`Co-Authored-By`), or
contributor in anything that goes to git — commits, merges, tags, PRs. Enforced
by a PreToolUse hook; policy: `docs/permissions/v3-no-coauthor.md`.

**Session notes** (`docs/notes.md`, gitignored) — before adding a line:
1. Bar: only a reusable directive not already in CLAUDE.md, a skill, or the code.
2. Dedup: refine a related line in place; add new only if none covers it.
3. Shape: matching section, one line, directive voice.
4. Sync: new section → add its index line in `memory/MEMORY.md`; emptied → remove it.

Promote to CLAUDE.md or a skill only with user review. Mechanism: `docs/notes-system.md`.

**Doc voice**:
- Planning or exploring options: keep intention and reasoning.
- Settling, or writing for a future session or reader: cut to the minimum.
- Docs addressed to Claude: write directives, not prose.

**Response style**:
- Answer only what was asked. No preamble, postamble, or summary of what you just did.
- Default concise; match answer length to question length.
- No hedging words (may/might/could/possibly). Verify the claim, or drop it and
  say in one line what could not be verified.
- Ask clarifying questions as plain text; do not use the AskUserQuestion tool.
- Verify version numbers, pricing, and API signatures against official docs, not memory.
- Scope discipline (YAGNI): understand the real goal, then make the smallest change that meets it.

## Project Overview

Kindo school payments: a parent picks a seeded demo parent, views an upcoming school
trip, registers a child, pays through an online form, and gets a receipt. Payments go
to a mock legacy processor (`LegacyPaymentProcessor`) behind an adapter. Take-home
challenge, 2-4 hour budget; the plan is `docs/kindo-payments/`.

- **Backend**: Python 3.14 + FastAPI (`backend/`), managed with uv
- **Frontend**: React + Vite + Tailwind (`frontend/`)
- **Database**: PostgreSQL 14.3, SQLAlchemy async + asyncpg, Alembic migrations
- **Tests**: pytest (`backend/`), Vitest + React Testing Library (`frontend/`)

The dev environment runs in a Dev Container (`.devcontainer/`).

## Docs

- `docs/kindo-payments/Kindo School Payments – Implementation Plan.md` - the
  source of truth for scope, data model, API, validation, tests, and build order.
  Read it before any task. `Tech_Challenge.md` is the original brief;
  `legacy_payment.py` is the processor.
- `CONTEXT.md` + `context/` — fast-orientation index (parts, seams, invariants,
  direction), citation-per-line, pulled on demand. Not a source of truth — see
  `CONTEXT.md` for the convention and which file to read per task.
- `docs/progress.md` — read at session start; update after each major feature completes.
- `docs/plans/` — per-feature product plan/decision files; read only the relevant file when working on a feature.
- `docs/skills/` — plan/decision docs for the `.claude/skills/` tooling itself (authoring guide + per-skill decision logs). Kept out of `docs/plans/` so product plans don't mix with tooling meta-docs.

## Reusables

`reusables/` holds portable React/TypeScript pieces to copy into projects:
`component/` (app components), `shadcn/` (shadcn/ui primitives), `util/` (helpers
and hooks). Check here before writing a new component or util; not part of any build.

## Commands

Planned; `backend/` and `frontend/` are not scaffolded yet. Update on scaffold.

### Backend (from `backend/`)

```bash
uv sync
uv run fastapi dev          # http://localhost:8000
uv run alembic upgrade head
uv run ruff check . && uv run ruff format --check .
```

### Tests

```bash
cd backend && uv run pytest
cd backend && uv run pytest -k <name>
cd frontend && npm test
```

### Frontend (from `frontend/`)

```bash
npm run dev                 # http://localhost:5173
npm run build
npm run lint && npx prettier --check .
```

## Configuration

### Backend

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (`kindo`) - set in `.devcontainer/.env` (gitignored); compose creates the database from them.
- `DATABASE_URL` - built in the container shell from the `POSTGRES_*` vars (`postgresql+asyncpg://...@db:5432/...`). `config.py` also converts a plain `postgresql://` URL (Render) to the asyncpg form.
- Frontend origin for CORS - set in `config.py`.

### Frontend

- `VITE_API_URL` - backend base URL, read at build time.

## Architecture

### Backend

`routers/` (HTTP) -> `services/` (payment service) -> `models/` (SQLAlchemy); `schemas/`
(Pydantic), `legacy/` (processor + adapter), `db.py`, `config.py`. Migrations and an
idempotent seed run on start. Every error returns `{ code, message, field }`.

### Frontend

One page: header (parent dropdown) -> trip list -> child picker -> payment form ->
receipt. API calls go through one client module.

### Tests

Backend tests patch `random` and `time.sleep` in the legacy processor. Each test file
ships in the same commit as the code it covers. No layout or visual tests.

## Skills

- When writing or editing code: follow: `.claude/skills/code-commenting/SKILL.md`
- When committing: follow `.claude/skills/git-commit/SKILL.md` — Conventional
  Commits, atomic commits, `feat`/`fix` need an issue ref.
- When writing or editing code: also follow `.claude/skills/code-discipline/SKILL.md`.
- When touching payments, validation, or error handling: follow `.claude/skills/owasp-guard/SKILL.md`.

## Project rules

From the implementation plan.

- Read the plan before any task. Do not add features outside it.
- Do not edit the `LegacyPaymentProcessor` code. Call it only through the adapter.
- One small task per prompt. Commit after each working step.
- Never log or store the full card number, expiry, or CVV. Store `card_last4` only.
- Write tests with the code they cover, in the same commit. Run tests, ruff (backend),
  and ESLint + Prettier (frontend) before declaring a task done.
- Keep notes for `AI_WORKINGS.md` as you build: key prompts, each case where output was
  wrong (how caught, the fix), and code written or rewritten by hand and why.

## Non-negotiable rules

- Don't use AskUserQuestion for open-ended architecture, design, or stack decisions, only for genuinely simple, discrete preference picks. For anything with real tradeoffs, lay out the options and a recommendation in plain text and let the user redirect.

- Read docs before probing - absolute. Verify from docs/,.devcontainer/, CI, or prior output; never inspect package or binary internals or run a throwaway script to find out.

- No em dash, ever: use - instead.

- No AI-clichéd wording, anywhere - write like a person would.

- Never write or edit outside `/workspaces/kindo-school-payments` (scratchpad excepted).

## Response style

- Answer only what was asked. No preamble, postamble, or summary of what you just did.
- Default concise; match answer length to question length.
- No hedging words (may/might/could/possibly). Verify the claim, or drop it and say in one line what could not be verified.
- Verify version numbers, pricing, and API signatures against official docs, not memory.
- Scope discipline (YAGNI): understand the real goal, then make the smallest change that meets it.