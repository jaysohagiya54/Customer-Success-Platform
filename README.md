# Customer Success Platform

AI-powered platform to manage customers, log interactions, and generate structured AI insights — built with FastAPI, Next.js, PostgreSQL, and Redis.

---

## Table of Contents

- [Quick Start — Docker](#quick-start--docker-recommended)
- [Local Development](#local-development-no-docker)
- [Free Cloud Deployment](#free-cloud-deployment-vercel--render--upstash)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Implementation Notes](#implementation-notes)
- [Security](#security)

---

## Quick Start — Docker (recommended)

> **Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Clone the repo

```bash
git clone <repo-url>
cd customer-success-platform
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```env
JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(48))">
OPENAI_API_KEY=<your key — leave blank to use built-in fallback, app still works>
```

### 3. Start everything

```bash
docker compose up --build
```

First build takes ~2–3 min (downloads images, installs dependencies). Subsequent starts are fast.

### 4. Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (Swagger docs) | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

Log in with the default admin account (see [Default Credentials](#default-credentials)).

### Stop

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop + wipe database volumes
```

---

## Local Development (no Docker)

> **Prerequisites:** Python 3.12+, Node.js 20+, PostgreSQL 16, Redis 7.

### Backend

```bash
cd backend

# 1. Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and REDIS_URL to your local services

# 4. Run database migrations
alembic upgrade head

# 5. Start the API server
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1  (already set in .env.example)

# 3. Start dev server
npm run dev
# App available at http://localhost:3000
```

### Type-check frontend

```bash
cd frontend
npm run typecheck
```

---

## Free Cloud Deployment (Vercel + Render + Upstash)

> **Free tier limits to know:**
> - Render free web service **spins down after 15 min inactivity** — first request after idle takes ~30s. Fine for demos.
> - Render free Postgres **expires after 90 days** — export data before then or upgrade.
> - Upstash Redis free tier: 10k commands/day, 256 MB.

### Overview

| Service | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend (FastAPI) | Render | Free |
| PostgreSQL | Render | Free (90 day expiry) |
| Redis | Upstash | Free |

---

### Step 1 — Set up Upstash Redis

1. Go to [upstash.com](https://upstash.com) → create account → **Create Database**
2. Choose region closest to your Render backend (e.g. `us-east-1`)
3. Copy the **Redis URL** — format: `rediss://default:<password>@<host>:6379`
4. Keep this — you'll need it in Step 2

---

### Step 2 — Deploy backend to Render

1. Push this repo to GitHub (if not already)
2. Go to [render.com](https://render.com) → **New → Blueprint**
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. Click **Apply** — this creates:
   - `csp-backend` web service (FastAPI)
   - `csp-postgres` database (PostgreSQL 16)
5. After creation, go to `csp-backend` → **Environment** and set these manually:
   ```
   REDIS_URL        = <your Upstash Redis URL from Step 1>
   ADMIN_PASSWORD   = <choose a strong password>
   CORS_ORIGINS     = https://your-app.vercel.app   ← set after Step 3
   ```
6. Wait for deploy to finish — copy your backend URL: `https://csp-backend-xxxx.onrender.com`

---

### Step 3 — Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://csp-backend-xxxx.onrender.com/api/v1
   ```
   (use your actual Render backend URL from Step 2)
4. Click **Deploy**
5. Copy your Vercel URL: `https://your-app.vercel.app`

---

### Step 4 — Wire CORS back to Render

1. Go to Render → `csp-backend` → **Environment**
2. Update `CORS_ORIGINS` to your Vercel URL:
   ```
   CORS_ORIGINS = https://your-app.vercel.app
   ```
3. Render redeploys automatically

---

### Step 5 — Verify

Open `https://your-app.vercel.app/login` and sign in with:
- Email: `admin@example.com`
- Password: whatever you set as `ADMIN_PASSWORD`

Check backend health: `https://csp-backend-xxxx.onrender.com/health`

---

### Troubleshooting

| Symptom | Fix |
|---|---|
| Login fails with CORS error | `CORS_ORIGINS` on Render doesn't match exact Vercel URL (no trailing slash) |
| Backend returns 503 on first request | Cold start — wait 30s and retry (Render free tier) |
| `DATABASE_URL` errors on Render | Postgres is still provisioning — wait 2-3 min after blueprint apply |
| Frontend shows blank page | Check `NEXT_PUBLIC_API_URL` is set correctly in Vercel env vars |
| Cookies not sent cross-origin | Vercel URL must be HTTPS; `CORS_ORIGINS` must match exactly |

---

## Environment Variables

All variables live in `.env` at the repo root for Docker. For local dev, backend uses `backend/.env` and frontend uses `frontend/.env.local`.

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET_KEY` | Signs JWTs — **change this in production** | dev placeholder |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Bootstrap admin password | `Admin123!` |
| `OPENAI_API_KEY` | Enables real AI insights; blank = heuristic fallback | *(empty)* |
| `OPENAI_MODEL` | OpenAI model | `gpt-4o-mini` |
| `DATABASE_URL` | Async PostgreSQL DSN | Docker Postgres |
| `REDIS_URL` | Redis DSN | Docker Redis |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend base URL for the frontend | `http://localhost:8000/api/v1` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `CACHE_TTL_SECONDS` | Dashboard cache TTL in Redis | `300` |

---

## Default Credentials

An admin account is auto-created on first startup using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

| Field | Default value |
|---|---|
| Email | `admin@example.com` |
| Password | `Admin123!` |

> Additional users registered via the UI get the **CSM** role. Only admins can delete customers.

---

## Project Structure

```
customer-success-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers + dependency injection
│   │   ├── core/         # Config, JWT/bcrypt, DB engine, Redis cache
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── repositories/ # Database queries (all SQL lives here)
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Request logging
│   │   ├── seed.py       # Admin bootstrap
│   │   └── main.py       # App factory, CORS, lifespan, /health
│   ├── alembic/          # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   │   ├── (auth)/   # login, register
│   │   │   └── (app)/    # dashboard, customers, interactions, profile, admin
│   │   ├── components/   # UI design system + layout + feature components
│   │   ├── store/        # Redux Toolkit slices + typed hooks
│   │   ├── lib/          # Axios client, Zod schemas, formatters
│   │   └── types/        # Shared domain types
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── .env.example          # Copy to .env and fill in
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Redux Toolkit, Tailwind CSS, Recharts |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (HttpOnly cookies), bcrypt, per-token JTI revocation via Redis |
| AI | OpenAI `gpt-4o-mini` with structured outputs + heuristic fallback |
| DevOps | Docker, Docker Compose, BuildKit cache mounts |

---

## Features

- **Authentication** — register, login, logout, JWT access + refresh tokens stored in HttpOnly cookies, token revocation on logout
- **Role-based access** — Admin (full access) and CSM roles; admins can delete customers
- **Customer management** — CRUD, search by name/company/email, status filter, pagination
- **Interaction tracking** — log meetings, calls, emails, notes; filter by type, customer, date range
- **AI insights** — generate structured summary, sentiment, action items, and risks from interaction notes; falls back to heuristic analyzer when no API key is set
- **Dashboard** — customer counts by status (bar chart), sentiment breakdown (donut chart), interaction totals, recent activity
- **Caching** — dashboard metrics cached in Redis; auto-invalidated on any data change

---

## Implementation Notes

### Authentication flow

Tokens are stored in `HttpOnly` cookies (not localStorage) — JavaScript cannot read them, eliminating XSS token theft. Three cookies are set on login:

| Cookie | HttpOnly | Purpose |
|---|---|---|
| `csp_access` | Yes | Short-lived access JWT (30 min) |
| `csp_refresh` | Yes | Long-lived refresh JWT (7 days) |
| `csp_logged_in` | No | Presence flag — JS reads this to guard routes without touching actual tokens |

On logout, both JTIs are written to the Redis blocklist. The `refresh` endpoint checks the blocklist before issuing new tokens, so a stolen refresh token cannot be replayed after logout.

### Backend architecture — layered

```
HTTP request → Router (api/) → Service (services/) → Repository (repositories/) → DB
```

- **Routers** — HTTP only: parse request, call service, return response. No business logic.
- **Services** — business rules, auth, AI calls, cache invalidation.
- **Repositories** — all SQL lives here. Services never construct queries directly.
- **Dependencies** (`api/deps.py`) — wires DB session, Redis, current user via FastAPI DI. Makes services swappable and keeps constructors explicit.

### Frontend state management

Redux Toolkit with one slice per domain (`auth`, `customers`, `interactions`, `dashboard`). Each slice tracks three async states:

```
loading    → initial list fetch
mutating   → create / update / delete in progress
error      → last error message (cleared on next action)
```

`createAsyncThunk` handles the async lifecycle. Components read from the store; they never call the API directly.

### Axios token refresh

The Axios instance in `lib/api.ts` has a response interceptor: on `401`, it calls `POST /auth/refresh` (cookies sent automatically via `withCredentials: true`), then retries the original request once. On second `401` (refresh also expired/revoked), it clears the auth state and redirects to `/login`.

### AI insights + fallback

Submitting interaction notes calls `POST /interactions/{id}/insights`. The service:
1. Sends notes to OpenAI with a JSON-schema-constrained prompt
2. Parses and validates the structured response (summary, sentiment, action items, risks)
3. If `OPENAI_API_KEY` is empty or the call fails — falls back to a deterministic heuristic analyzer (keyword sentiment scoring + pattern-based extraction)

The `source` field on each insight reports `"ai"` or `"fallback"`. The app is fully functional without an API key.

### Dashboard caching

Dashboard aggregates across all tables — most expensive read in the system. Cached under a single Redis key (`dashboard:metrics`) with TTL from `CACHE_TTL_SECONDS`.

- **Cache hit** — returns immediately, response includes `cached: true`
- **Invalidation** — every customer/interaction create, update, delete, and insight generation deletes the key; next read recomputes fresh data
- **Redis outage** — cache wrapper swallows errors and falls back to uncached DB reads; no requests fail

### Database model

```
User 1──* Customer 1──* Interaction 1──1 AIInsight
```

| Model | Key fields |
|---|---|
| `User` | id, email (unique), hashed_password, full_name, role (`admin`/`csm`), is_active |
| `Customer` | name, company, email (unique), phone, status (`prospect`/`active`/`at_risk`/`churned`), owner → User |
| `Interaction` | customer (FK, cascade delete), type (`meeting`/`call`/`email`/`note`), title, notes, occurred_at, author → User |
| `AIInsight` | one per interaction (cascade delete), summary, sentiment, action_items[], risks[], source, model |

Indexes on FKs, `status`, and `occurred_at` — list filters and dashboard aggregations hit indexes, not full table scans.

### Docker build optimization

Both Dockerfiles use BuildKit cache mounts:

```dockerfile
# Backend — pip cache survives rebuilds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-deps -r requirements.lock

# Frontend — npm cache survives rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund
```

`requirements.lock` is a `pip freeze` snapshot installed with `--no-deps` — bypasses pip's resolver entirely, avoids dependency conflicts in Docker.

---

## Security

- Passwords hashed with bcrypt; never stored in plaintext
- JWTs stored in `HttpOnly + Secure + SameSite=Strict` cookies — not accessible to JavaScript
- Access and refresh tokens are typed (`access` / `refresh`) — one cannot be replayed as the other
- Both access and refresh JTIs are blocklisted in Redis on logout
- `JWT_SECRET_KEY` validated at startup — app refuses to start with a weak or default key
- All inputs validated server-side with Pydantic (client-side Zod is UX only)
- CORS restricted to configured origins
- No sensitive values committed — everything via environment variables
