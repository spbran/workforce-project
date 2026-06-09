# Spencer's Workforce Delivery Platform

A web application for managing call-center agents, campaign assignments, and
customer-facing KPI dashboards — built against the provided SQLite database.

Tropical "ocean → sunset" design language: deep ocean-teal canvas, warm
yellow→orange gradient accents with cool teal/green accents, card-dense layouts,
and animated, gamified dashboards.

## User stories

1. **Admin** — manage agent properties (name, email, active status) **and**
   campaign assignments in a single UI (`/admin/agents`). Campaigns are managed
   at `/admin/campaigns`.
2. **Customer** — a campaign dashboard of KPIs (`/customer`) showing
   **hours worked grouped by day, week, and month**, plus peak day, averages,
   an activity heatmap, and gamification (levels, XP, achievements).

Responsive design throughout, with animation (Framer Motion) and gamification
on the customer dashboard.

## Stack

- **Backend:** FastAPI + `aiosqlite` (fully async), Pydantic models. Serves a
  JSON API and (in production) the compiled React bundle. Swagger docs at `/docs`.
- **Frontend:** React (Vite) + React Router, Framer Motion (animation),
  Recharts (charts), lucide-react (icons).
- **Database:** the provided `shyftoff.db` (SQLite), unchanged schema.

## Running in development

Two processes — the API and the Vite dev server (which proxies `/api` → API).

### macOS / Linux

```bash
# 1. Backend (from the project root)
python3 -m venv .venv
.venv/bin/pip install fastapi uvicorn aiosqlite
.venv/bin/uvicorn app:app --port 8000 --reload

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### Windows (Command Prompt or PowerShell)

> **Prerequisites:** [Python 3.10+](https://www.python.org/downloads/) and [Node.js 18+](https://nodejs.org/) must be installed and on your PATH.

```bat
:: 1. Backend (from the project root — run in Terminal 1)
python -m venv .venv
.venv\Scripts\pip install fastapi uvicorn aiosqlite
.venv\Scripts\uvicorn app:app --port 8000 --reload
```

Open a second terminal window for the frontend:

```bat
:: 2. Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

> **Tip:** If `python` is not recognised, try `py` instead (the Python Launcher for Windows).
> If you hit an execution-policy error in PowerShell, run:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

## Running as a single server (production)

Build the frontend, then let FastAPI serve everything from one port.

### macOS / Linux

```bash
cd frontend && npm run build && cd ..
.venv/bin/uvicorn app:app --port 8000
```

### Windows

```bat
cd frontend
npm run build
cd ..
.venv\Scripts\uvicorn app:app --port 8000
```

Open **http://localhost:8000** — FastAPI serves the built SPA and falls back to
`index.html` for client-side routes.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/overview` | Aggregate counts for stat cards |
| GET/POST | `/api/agents` | List / create agents |
| PUT/DELETE | `/api/agents/{id}` | Update / delete an agent |
| GET | `/api/agents/{id}/campaigns` | Campaigns assigned to an agent |
| POST | `/api/agents/{id}/campaigns` | Assign a campaign |
| DELETE | `/api/agents/{id}/campaigns/{cid}` | Unassign a campaign |
| GET | `/api/campaigns` | List campaigns (with agent counts & hours) |
| PUT | `/api/campaigns/{id}` | Update a campaign |
| GET | `/api/campaigns/{id}/kpis/summary` | Hours by day / week / month + totals |
```
