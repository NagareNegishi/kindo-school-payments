# Render deploy guide

Verified 2026-10-25 against render.com/docs. Do the steps in order. Where the docs do not give a screen label, the step says "on screen" and describes where to look. Reference and open gaps are at the bottom.

## Before you start

1. Create a GitHub repo and push this code to `main`.
2. Sign in at dashboard.render.com.
3. Connect GitHub (skip if already done): open **Account Settings**, scroll to **Account Security**, under **Git Deployment Credentials** click **Add credential**, choose GitHub and confirm. On GitHub's page, check **Repository access** and include your repo. You can also do this from the service creation form in step 2.

## 1. Database

1. Click **+ New** > **Postgres** (or open dashboard.render.com/new/database).
2. **Name**: `kindo-db`
3. **Database** and **User**: leave blank (optional, cannot be changed later).
4. **Region**: pick one and note it. The backend must use the same region and the same Render account.
5. **PostgreSQL Version**: `14` (matches the dev container).
6. Compute plan: choose **Free**. Storage is fixed at 1 GB on Free.
7. Click **Create Database**. Wait until the status says **Available**.
8. Open the **Connect** menu at the top right of the database page and copy the **internal** URL (the exact label is not in the docs, so look on screen for the one marked internal). It looks like `postgresql://USER:PASSWORD@HOST:5432/DATABASE`. Keep it for step 2.
9. Create no tables. The backend creates them on its first start.

## 2. Backend (web service)

1. Click **+ New** > **Web Service**. Source: Git Provider. Select your repo and click **Connect**.
2. Fill in the form:
   - **Name**: `kindo-api`
   - **Language**: Python
   - **Branch**: `main`
   - **Region**: the same region as the database
   - **Root Directory**: `backend`
   - **Build Command**: `uv sync`
   - **Start Command**: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Compute**: **Free**
3. Open **Advanced** and add these environment variables (**+ Add Environment Variable**, enter **Key** and **Value**):

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.14.8` |
   | `DATABASE_URL` | the internal URL from step 1, unchanged. Do not add `sslmode`. |
   | `FRONTEND_ORIGIN` | `https://placeholder.invalid` (replaced in step 4) |

4. Click the create button at the bottom of the form (it is named **Create Web Service** or **Deploy**). The deploy starts.
5. Watch the log on the service's **Deploys** page until the status says **Live**. If it says **Failed**, read the log: a wrong start command or a "Port scan timeout reached" message is explained in the gaps at the bottom.
6. Copy the service's `onrender.com` URL from the top of its page.
7. Open `https://<backend-url>/parents` in a browser. It must return three parents. The first request can take a minute while the service wakes.

## 3. Frontend (static site)

1. Click **+ New** > **Static Site**. Select the same repo and click **Connect**.
2. Fill in the form:
   - **Name**: `kindo-web`
   - **Branch**: `main`
   - **Root Directory**: `frontend`, if the form shows this field. If it does not, leave it and see step 5.
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Add the environment variable: **Key** `VITE_API_URL`, **Value** the backend URL from step 2, with no trailing slash.
4. Click the create button (**Create Static Site** or **Deploy**). Wait for **Live**, then copy the site URL.
5. Only if the form had no Root Directory field: the first build fails because it ran from the repo root. Open the service's **Settings**, scroll to **Build & Deploy**, find **Root Directory**, click **Edit**, enter `frontend`, click **Save Changes**, then **Update Fields**. Then on the **Deploys** page open **Manual Deploy** and choose **Deploy latest commit**.

## 4. Connect them

1. Open the backend service, click **Environment** in the left pane.
2. Edit `FRONTEND_ORIGIN`: set it to the static site URL exactly as the browser shows it, with no trailing slash.
3. Click **Save and deploy**. Wait for **Live**.

## 5. Check it works

1. Open the static site URL. The trip details load and the parent dropdown has three names.
2. Pick a parent, register a child and pay. A payment is declined at random 10% of the time, so retry.
3. A successful payment ends in a receipt, and the unpaid registration disappears from the list.
4. Open the backend's **Logs** page. You see `app.payments` lines for each attempt, and no card number, expiry or CVV.
5. Enter a wrong card number. An error shows on the field.

## 6. Before a demo

1. A free web service sleeps after 15 minutes idle. Open `https://<backend-url>/parents` a minute or two before you start.
2. The free database expires 30 days after creation, and the seeded trip is dated 30 days out. To reset:
   1. Scroll to the bottom of the database's **Info** page and click **Delete Database**. Only one free database can exist per workspace, so delete first.
   2. Repeat step 1 with the same name and region.
   3. In the backend's **Environment**, replace `DATABASE_URL` with the new internal URL and click **Save and deploy**. Render does not update it for you.

## 7. Finish the docs

1. Add the live URLs to `README.md`.
2. Tick step 10 in `docs/kindo-payments/impl.md`.
3. Add `DATABASE_URL`, `FRONTEND_ORIGIN` and `VITE_API_URL` to the `.env.example` files.

## If you change `VITE_API_URL` later

Open the static site, click **Environment** in the left pane, edit the value and click **Save, rebuild, and deploy**. The value is baked in at build time, so a rebuild is required.

---

# Reference

## Confirmed

- `PYTHON_VERSION` must be a full version. Any released version from 3.7.3 on is accepted, and 3.14.8 is the current default (render.com/docs/python-version).
- uv is added to the runtime when `uv.lock` is in the root directory. `uv sync` is a listed Python build command (render.com/docs/uv-version, render.com/docs/deploys).
- The internal DB URL needs the same account and region. Format `postgresql://USER:PASSWORD@HOST:5432/DATABASE`, no query parameters. Internal TLS is optional (render.com/docs/postgresql-creating-connecting).
- asyncpg's default `ssl` mode is `prefer`, so the URL works as given and `config.py` needs no change (asyncpg docs).
- `$PORT` defaults to 10000. Bind `0.0.0.0` (render.com/docs/web-services).
- Free web services have no pre-deploy command, so migrations stay in the app's startup (`app/main.py`).
- Start command and health checks each have a 15-minute limit. A health check path is optional.
- Free Postgres expires 30 days after creation, with a 14-day grace period before deletion. A free web service sleeps after 15 minutes idle and takes about a minute to start (render.com/docs/free).
- Menu and field names above come from render.com/docs/postgresql-creating-connecting, git-provider, web-services, your-first-deploy, configure-environment-variables, deploys, static-sites and monorepo-support.
- A Blueprint (`render.yaml`) is not needed.

## Open gaps (none block the deploy)

| # | Gap | Action |
|---|---|---|
| G1 | No Render page shows a `uv run` start command. | If the deploy fails on the start command, read the log before changing it. |
| G2 | Vite build command and `dist` are not on render.com/docs. | Confirm the site builds in step 3. |
| G3 | Port-scan timeout length is undocumented, and it is unknown whether migrations and seed finish before the port opens. | If the first deploy fails with "Port scan timeout reached", research again. |
| G4 | Unknown whether SQLAlchemy's asyncpg dialect accepts `sslmode` in the URL. | Leave it out. |
| G5 | Render docs conflict on whether `rootDir` changes the base of `staticPublishPath`. | Matters only if you write a `render.yaml`. |
| G6 | Docs do not give: the label of the internal URL field, the label of the public URL, region and plan dropdown wording, the final create button name, GitHub-side options for granting one repo, whether the static site creation form has Root Directory, and whether a static site offers the same three save options. | Use what is on screen; the steps above say what to look for. |
