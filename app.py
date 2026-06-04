import os
import aiosqlite
from typing import AsyncGenerator
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

DB_PATH = os.path.join(os.path.dirname(__file__), "shyftoff.db")
DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

app = FastAPI(title="Spencer's Workforce Delivery Platform API")

# Allow the Vite dev server to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_db() -> AsyncGenerator:
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        yield conn


# ── Pydantic models ──────────────────────────────────────────────────────────

class AgentIn(BaseModel):
    first_name: str
    last_name: str
    email: str
    is_active: int = 1


class CampaignIn(BaseModel):
    name: str
    description: str = ""
    is_active: int = 1


class AssignIn(BaseModel):
    campaign_id: int


# ── Agents ────────────────────────────────────────────────────────────────────

@app.get("/api/agents")
async def get_agents(conn=Depends(get_db)):
    async with conn.execute(
        "SELECT id, first_name, last_name, email, is_active, created_at FROM agent ORDER BY last_name, first_name"
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/api/agents", status_code=201)
async def create_agent(data: AgentIn, conn=Depends(get_db)):
    async with conn.execute(
        "INSERT INTO agent (first_name, last_name, email, is_active) VALUES (?,?,?,?)",
        (data.first_name, data.last_name, data.email, data.is_active),
    ) as cur:
        new_id = cur.lastrowid
    await conn.commit()
    return {"id": new_id}


@app.put("/api/agents/{agent_id}")
async def update_agent(agent_id: int, data: AgentIn, conn=Depends(get_db)):
    await conn.execute(
        "UPDATE agent SET first_name=?, last_name=?, email=?, is_active=? WHERE id=?",
        (data.first_name, data.last_name, data.email, data.is_active, agent_id),
    )
    await conn.commit()
    return {"ok": True}


@app.delete("/api/agents/{agent_id}")
async def delete_agent(agent_id: int, conn=Depends(get_db)):
    await conn.execute("DELETE FROM campaign_agent WHERE agent_id=?", (agent_id,))
    await conn.execute("DELETE FROM agent WHERE id=?", (agent_id,))
    await conn.commit()
    return {"ok": True}


# ── Campaigns ─────────────────────────────────────────────────────────────────

@app.get("/api/campaigns")
async def get_campaigns(conn=Depends(get_db)):
    async with conn.execute(
        """SELECT c.id, c.name, c.description, c.is_active, c.created_at,
                  (SELECT COUNT(*) FROM campaign_agent ca WHERE ca.campaign_id = c.id) AS agent_count,
                  (SELECT COALESCE(SUM(k.hours),0) FROM campaign_kpi k WHERE k.campaign_id = c.id) AS total_hours
           FROM campaign c ORDER BY c.name"""
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@app.put("/api/campaigns/{campaign_id}")
async def update_campaign(campaign_id: int, data: CampaignIn, conn=Depends(get_db)):
    await conn.execute(
        "UPDATE campaign SET name=?, description=?, is_active=? WHERE id=?",
        (data.name, data.description, data.is_active, campaign_id),
    )
    await conn.commit()
    return {"ok": True}


# ── Assignments ───────────────────────────────────────────────────────────────

@app.get("/api/agents/{agent_id}/campaigns")
async def get_agent_campaigns(agent_id: int, conn=Depends(get_db)):
    async with conn.execute(
        """SELECT c.id, c.name, c.is_active
           FROM campaign c
           JOIN campaign_agent ca ON ca.campaign_id = c.id
           WHERE ca.agent_id = ?""",
        (agent_id,),
    ) as cur:
        rows = await cur.fetchall()
    return [dict(r) for r in rows]


@app.post("/api/agents/{agent_id}/campaigns")
async def assign_campaign(agent_id: int, data: AssignIn, conn=Depends(get_db)):
    try:
        await conn.execute(
            "INSERT INTO campaign_agent (agent_id, campaign_id) VALUES (?,?)",
            (agent_id, data.campaign_id),
        )
        await conn.commit()
    except Exception:
        pass
    return {"ok": True}


@app.delete("/api/agents/{agent_id}/campaigns/{campaign_id}")
async def unassign_campaign(agent_id: int, campaign_id: int, conn=Depends(get_db)):
    await conn.execute(
        "DELETE FROM campaign_agent WHERE agent_id=? AND campaign_id=?",
        (agent_id, campaign_id),
    )
    await conn.commit()
    return {"ok": True}


# ── Overview (admin dashboard stats) ──────────────────────────────────────────

@app.get("/api/overview")
async def overview(conn=Depends(get_db)):
    async with conn.execute("SELECT COUNT(*) c, SUM(is_active) a FROM agent") as cur:
        ag = dict(await cur.fetchone())
    async with conn.execute("SELECT COUNT(*) c, SUM(is_active) a FROM campaign") as cur:
        cm = dict(await cur.fetchone())
    async with conn.execute("SELECT COUNT(*) c FROM campaign_agent") as cur:
        asg = dict(await cur.fetchone())
    async with conn.execute("SELECT SUM(hours) h FROM campaign_kpi") as cur:
        hrs = dict(await cur.fetchone())
    return {
        "agents_total": ag["c"] or 0,
        "agents_active": ag["a"] or 0,
        "campaigns_total": cm["c"] or 0,
        "campaigns_active": cm["a"] or 0,
        "assignments": asg["c"] or 0,
        "total_hours": hrs["h"] or 0,
    }


@app.get("/api/campaigns/{campaign_id}/agents/count")
async def campaign_agent_count(campaign_id: int, conn=Depends(get_db)):
    async with conn.execute(
        "SELECT COUNT(*) c FROM campaign_agent WHERE campaign_id=?", (campaign_id,)
    ) as cur:
        return {"count": dict(await cur.fetchone())["c"]}


# ── KPIs ──────────────────────────────────────────────────────────────────────

@app.get("/api/campaigns/{campaign_id}/kpis/summary")
async def get_kpis_summary(campaign_id: int, conn=Depends(get_db)):
    async with conn.execute(
        "SELECT date, SUM(hours) as hours FROM campaign_kpi WHERE campaign_id=? GROUP BY date ORDER BY date",
        (campaign_id,),
    ) as cur:
        daily = [dict(r) for r in await cur.fetchall()]

    async with conn.execute(
        """SELECT strftime('%Y-W%W', date) as week, SUM(hours) as hours
           FROM campaign_kpi WHERE campaign_id=? GROUP BY week ORDER BY week""",
        (campaign_id,),
    ) as cur:
        weekly = [dict(r) for r in await cur.fetchall()]

    async with conn.execute(
        """SELECT strftime('%Y-%m', date) as month, SUM(hours) as hours
           FROM campaign_kpi WHERE campaign_id=? GROUP BY month ORDER BY month""",
        (campaign_id,),
    ) as cur:
        monthly = [dict(r) for r in await cur.fetchall()]

    async with conn.execute(
        "SELECT SUM(hours) as total, COUNT(DISTINCT date) as days FROM campaign_kpi WHERE campaign_id=?",
        (campaign_id,),
    ) as cur:
        row = dict(await cur.fetchone())

    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
        "total_hours": row["total"] or 0,
        "total_days": row["days"] or 0,
    }


# ── Serve built SPA (production) ──────────────────────────────────────────────
# In dev, the React app runs on the Vite server (port 5173) and proxies /api here.
# After `npm run build`, this serves the compiled bundle and falls back to
# index.html so client-side routes (e.g. /admin/agents) resolve correctly.
if os.path.isdir(DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        candidate = os.path.join(DIST, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(DIST, "index.html"))
