import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Users, Clock, Search, X, Pencil } from 'lucide-react'
import { api } from '../lib/api'
import { fmt } from '../lib/helpers'
import StatCard from '../components/StatCard'
import { useToast } from '../components/Toast'

function CampaignDrawer({ campaign, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', description: '', is_active: 1 })
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setForm({ name: campaign.name, description: campaign.description || '', is_active: campaign.is_active })
  }, [campaign])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const save = async () => {
    setBusy(true)
    try { await api.updateCampaign(campaign.id, form); toast('Campaign updated'); onSaved() }
    catch { toast('Could not save', 'err') }
    finally { setBusy(false) }
  }
  return (
    <AnimatePresence>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }}>
        <div className="drawer-head">
          <h2>Edit Campaign</h2>
          <button className="btn-icon" onClick={onClose}><X /></button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <label>Campaign Name</label>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="field">
            <label>Status</label>
            <div className="row" style={{ justifyContent: 'space-between', padding: '.55rem .85rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)' }}>
              <span>{form.is_active ? 'Active' : 'Inactive'}</span>
              <label className="switch">
                <input type="checkbox" checked={!!form.is_active} onChange={(e) => set('is_active', e.target.checked ? 1 : 0)} />
                <span className="track" />
              </label>
            </div>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>Save Changes</button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => { setCampaigns(await api.campaigns()); setLoading(false) }
  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () => campaigns.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())),
    [campaigns, q]
  )

  const totalHours = campaigns.reduce((s, c) => s + (c.total_hours || 0), 0)
  const totalAssign = campaigns.reduce((s, c) => s + (c.agent_count || 0), 0)

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Campaigns</h1>
          <p>Configure campaigns and review staffing &amp; output</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard index={0} icon={Megaphone} label="Total Campaigns" value={campaigns.length} accent="pink" />
        <StatCard index={1} icon={Users} label="Total Assignments" value={totalAssign} accent="purple" />
        <StatCard index={2} icon={Clock} label="Hours Logged" value={Math.round(totalHours)} suffix=" h" accent="cyan" />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row" style={{ gap: '.9rem' }}>
            <h3>All Campaigns</h3>
            <span className="chip-mini">{filtered.length} shown</span>
          </div>
          <div className="search">
            <Search />
            <input placeholder="Search campaigns…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="tbl-wrap">
          {loading ? (
            <div className="empty"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Agents</th>
                  <th>Hours Logged</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="nm" style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="em muted" style={{ fontSize: '.74rem', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description || '—'}
                      </div>
                    </td>
                    <td><span className="chip chip-purple">{c.agent_count} agents</span></td>
                    <td style={{ fontWeight: 600 }}>{fmt(c.total_hours, 0)} h</td>
                    <td>
                      <span className={`chip ${c.is_active ? 'chip-green' : 'chip-red'}`}>
                        <span className={`dot ${c.is_active ? 'dot-green' : 'dot-red'}`} />
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                        <Pencil size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <CampaignDrawer campaign={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
      )}
    </>
  )
}
