# Kindo School Payments

A parent registers a child for a school field trip and pays for it online. Payments
go to a mock legacy processor through an adapter. This is a take-home challenge with a
2-4 hour budget.

**Status:** setup only. The dev container, project docs and Claude Code config are in
place. `backend/` and `frontend/` are not scaffolded yet, so there is nothing to run.

## What it will do

1. The parent picks themselves from a header dropdown (a stand-in for login).
2. They see upcoming trips with date, location and cost.
3. They pick one of their children, or add a new one, and register for a trip.
4. They pay with a card form. Validation runs on the frontend and the backend.
5. They get a receipt with the transaction ID, amount, child, trip and last four card digits.

A declined payment shows the processor message and can be retried on the same form.
Full scope, data model, API and build order: [`docs/kindo-payments/`](docs/kindo-payments/).

## Stack

| Part | Choice |
| --- | --- |
| Backend | Python 3.14, FastAPI, SQLAlchemy (async), Alembic, managed with uv 0.13.5 |
| Frontend | React, Vite, Tailwind CSS |
| Database | PostgreSQL 14.3 (asyncpg driver), database `kindo` |
| Tests | pytest, Vitest + React Testing Library |
| Deployment | Render free tier (planned) |

## Setup

You need Docker and VS Code with the Dev Containers extension.

1. Create `.devcontainer/.env` with `POSTGRES_USER`, `POSTGRES_PASSWORD` and
   `POSTGRES_DB=kindo`. The file is gitignored.
2. Open the folder in VS Code and choose "Reopen in Container".
3. Ports 8000 (backend), 5173 (frontend) and 5432 (Postgres) are forwarded.

The container blocks outbound traffic except an allowlist: GitHub, npm, PyPI,
`api.anthropic.com`, `api.osv.dev`, `ui.shadcn.com` and the VS Code marketplace. If an
npm or uv install is rejected, rerun `sudo /usr/local/bin/project-firewall.sh`.

Commands for running the backend, frontend and tests are in `CLAUDE.md` and will work
once the projects are scaffolded.

## Assumptions

- No login. A seeded parent is chosen from a dropdown, and each parent sees only their own children.
- Currency is NZD.
- The legacy processor is a mock. No real card data is used, and only the last four digits are stored.
- Registration and payment are separate steps. An unpaid registration stays open.

## Repo layout

- `docs/kindo-payments/`: the challenge brief, implementation plan and legacy processor.
- `.devcontainer/`: Docker Compose dev environment with the firewall.
- `.claude/`: Claude Code settings, path-scoped rules and skills. Project instructions are in `CLAUDE.md`.
- `examples/`: reference files left from the project template (CI pipelines and the Python + Postgres stack notes).
- `reusables/`: React and TypeScript pieces to copy in. Not part of any build.

`AI_WORKINGS.md` (how AI was used on this project) will be added and linked here.
