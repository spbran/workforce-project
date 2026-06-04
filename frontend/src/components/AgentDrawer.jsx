import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { useToast } from './Toast'
import { avatarGradient, initials } from '../lib/helpers'

const blank = { first_name: '', last_name: '', email: '', is_active: 1 }

export default function AgentDrawer({ agent, campaigns, onClose, onSaved, onDeleted }) {
  const toast = useToast()
  const isNew = !agent?.id
  const [form, setForm] = useState(blank)
  const [assigned, setAssigned] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (agent?.id) {
      setForm({ first_name: agent.first_name, last_name: agent.last_name, email: agent.email, is_active: agent.is_active })
      api.agentCampaigns(agent.id).then((c) => setAssigned(c.map((x) => x.id)))
    } else {
      setForm(blank)
      setAssigned([])
    }
  }, [agent])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.email) {
      toast('Please fill in all fields', 'err'); return
    }
    setBusy(true)
    try {
      if (isNew) {
        const { id } = await api.createAgent(form)
        for (const cid of assigned) await api.assign(id, cid)
        toast('Agent created')
      } else {
        await api.updateAgent(agent.id, form)
        toast('Agent updated')
      }
      onSaved()
    } catch {
      toast('Could not save agent', 'err')
    } finally { setBusy(false) }
  }

  const toggleAssign = async (cid, add) => {
    if (isNew) {
      setAssigned((a) => (add ? [...a, cid] : a.filter((x) => x !== cid)))
      return
    }
    try {
      if (add) await api.assign(agent.id, cid)
      else await api.unassign(agent.id, cid)
      setAssigned((a) => (add ? [...a, cid] : a.filter((x) => x !== cid)))
    } catch { toast('Assignment failed', 'err') }
  }

  const remove = async () => {
    setBusy(true)
    try { await api.deleteAgent(agent.id); toast('Agent deleted'); onDeleted() }
    catch { toast('Delete failed', 'err') }
    finally { setBusy(false) }
  }

  const assignedList = campaigns.filter((c) => assigned.includes(c.id))
  const availableList = campaigns.filter((c) => !assigned.includes(c.id))
  const grad = avatarGradient(form.email || 'new')

  return (
    <AnimatePresence>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <div className="drawer-head">
          <div className="row">
            <div className="avatar" style={{ background: grad, width: 40, height: 40 }}>
              {initials(form.first_name, form.last_name) || '+'}
            </div>
            <h2>{isNew ? 'New Agent' : `${form.first_name} ${form.last_name}`}</h2>
          </div>
          <button className="btn-icon" onClick={onClose}><X /></button>
        </div>

        <div className="drawer-body">
          <div className="row" style={{ gap: '.75rem' }}>
            <div className="field" style={{ flex: 1 }}>
              <label>First Name</label>
              <input className="input" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Last Name</label>
              <input className="input" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
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

          <div>
            <label className="field" style={{ marginBottom: '.7rem', display: 'block' }}>
              <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Campaign Assignments
              </span>
            </label>
            <div className="assign-grid">
              <div className="assign-col">
                <h4>Assigned · {assignedList.length}</h4>
                <div className="assign-list">
                  {assignedList.length === 0 && <div className="assign-empty">None yet</div>}
                  {assignedList.map((c) => (
                    <div className="assign-row" key={c.id}>
                      <span>{c.name}</span>
                      <button className="rm" onClick={() => toggleAssign(c.id, false)}><Minus /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="assign-col">
                <h4>Available · {availableList.length}</h4>
                <div className="assign-list">
                  {availableList.length === 0 && <div className="assign-empty">All assigned</div>}
                  {availableList.map((c) => (
                    <div className="assign-row" key={c.id}>
                      <span>{c.name}</span>
                      <button className="add" onClick={() => toggleAssign(c.id, true)}><Plus /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          {!isNew && (
            <button className="btn btn-danger btn-sm" onClick={remove} disabled={busy} style={{ marginRight: 'auto' }}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>{isNew ? 'Create Agent' : 'Save Changes'}</button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
