import { NavLink } from 'react-router-dom'
import { Users, Megaphone, LayoutDashboard, Rocket } from 'lucide-react'

export default function Sidebar({ counts = {}, open }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-rocket">🚀</div>
        <span className="sidebar-wordmark">Spencer's Workforce Delivery Platform</span>
      </div>

      <div className="nav-group">
        <div className="nav-group-label">Workforce</div>
        <NavLink to="/admin/agents" className="nav-item">
          <Users /> Agents
          {counts.agents != null && <span className="nav-count">{counts.agents}</span>}
        </NavLink>
        <NavLink to="/admin/campaigns" className="nav-item">
          <Megaphone /> Campaigns
          {counts.campaigns != null && <span className="nav-count">{counts.campaigns}</span>}
        </NavLink>
      </div>

      <div className="nav-group">
        <div className="nav-group-label">Analytics</div>
        <NavLink to="/customer" className="nav-item">
          <LayoutDashboard /> Customer Dashboard
        </NavLink>
      </div>

      <div className="sidebar-foot">
        <div className="sidebar-foot-title">Workforce Delivery</div>
        <div className="sidebar-foot-sub">Agentic ops, made simple ✨</div>
      </div>
    </aside>
  )
}
