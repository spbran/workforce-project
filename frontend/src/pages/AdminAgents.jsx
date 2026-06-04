import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserCheck, Megaphone, Link2, Search, Plus, Pencil } from 'lucide-react'
import { api } from '../lib/api'
import { avatarGradient, initials } from '../lib/helpers'
import StatCard from '../components/StatCard'
import AgentDrawer from '../components/AgentDrawer'

export default function AdminAgents() {
  const { refreshCounts } = useOutletContext()
  const [agents, setAgents] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [overview, setOverview] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null) // agent object or {} for new, or null
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [a, c, o] = await Promise.all([api.agents(), api.campaigns(), api.overview()])
    setAgents(a); setCampaigns(c); setOverview(o); setLoading(false)
    refreshCounts()
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchQ = `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase().includes(q.toLowerCase())
      const matchF = filter === 'all' || (filter === 'active' ? a.is_active : !a.is_active)
      return matchQ && matchF
    })
  }, [agents, q, filter])

  const closeDrawer = () => setEditing(null)
  const onSaved = () => { closeDrawer(); load() }
  const onDeleted = () => { closeDrawer(); load() }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Agents</h1>
          <p>Manage agent properties and campaign assignments</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setEditing({})}>
            <Plus /> New Agent
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard index={0} icon={Users} label="Total Agents" value={overview?.agents_total ?? 0} accent="pink" />
        <StatCard index={1} icon={UserCheck} label="Active Agents" value={overview?.agents_active ?? 0} accent="cyan" />
        <StatCard index={2} icon={Megaphone} label="Campaigns" value={overview?.campaigns_total ?? 0} accent="purple" />
        <StatCard index={3} icon={Link2} label="Assignments" value={overview?.assignments ?? 0} accent="amber" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row" style={{ gap: '.9rem' }}>
            <h3>Directory</h3>
            <span className="chip-mini">{filtered.length} shown</span>
          </div>
          <div className="row">
            <div className="seg">
              {['all', 'active', 'inactive'].map((f) => (
                <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="search">
              <Search />
              <input placeholder="Search agents…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="tbl-wrap">
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="cell-agent">
                        <div className="avatar" style={{ background: avatarGradient(a.email) }}>
                          {initials(a.first_name, a.last_name)}
                        </div>
                        <div>
                          <div className="nm">{a.first_name} {a.last_name}</div>
                          <div className="em">{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${a.is_active ? 'chip-green' : 'chip-red'}`}>
                        <span className={`dot ${a.is_active ? 'dot-green' : 'dot-red'}`} />
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="muted">{(a.created_at || '').slice(0, 10)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(a)}>
                        <Pencil size={14} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length > 100 && (
            <div style={{ padding: '.9rem 1.35rem', fontSize: '.78rem', color: 'var(--text-3)' }}>
              Showing first 100 of {filtered.length}. Refine your search to narrow results.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <AgentDrawer
            agent={editing}
            campaigns={campaigns}
            onClose={closeDrawer}
            onSaved={onSaved}
            onDeleted={onDeleted}
          />
        )}
      </AnimatePresence>
    </>
  )
}
