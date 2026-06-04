import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import { Clock, CalendarDays, Flame, Zap, BarChart3 } from 'lucide-react'
import { api } from '../lib/api'
import { levelFor, achievements, fmt } from '../lib/helpers'
import StatCard from '../components/StatCard'
import LevelRing from '../components/LevelRing'
import Heatmap from '../components/Heatmap'

const PERIODS = [
  { key: 'daily', label: 'Day' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const displayLabel = payload[0]?.payload?.tooltip ?? label
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: 10, padding: '.55rem .8rem', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '.72rem', color: 'var(--text-3)', marginBottom: 2 }}>{displayLabel}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value.toFixed(1)} hours</div>
    </div>
  )
}

function SectionHead({ title, children }) {
  return (
    <div className="section-head">
      <div className="section-divider">{title}</div>
      {children}
    </div>
  )
}

export default function CustomerDashboard() {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState('')
  const [overview, setOverview] = useState(null)
  const [summary, setSummary] = useState(null)
  const [period, setPeriod] = useState('daily')
  const [campaignLoading, setCampaignLoading] = useState(false)
  const [overviewLoading, setOverviewLoading] = useState(true)

  useEffect(() => {
    api.campaigns().then(setCampaigns)
    api.customerOverview().then((s) => { setOverview(s); setOverviewLoading(false) })
  }, [])

  useEffect(() => {
    if (!selected) { setSummary(null); return }
    setCampaignLoading(true)
    api.kpiSummary(selected).then((s) => { setSummary(s); setCampaignLoading(false) })
  }, [selected])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h >= 4 && h < 12) return 'Good morning'
    if (h >= 12 && h < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // Tier + achievements always derived from aggregate overview
  const derived = useMemo(() => {
    if (!overview) return null
    const peak = overview.daily.length ? Math.max(...overview.daily.map((d) => d.hours)) : 0
    const avg = overview.total_days ? overview.total_hours / overview.total_days : 0
    const spark = overview.daily.slice(-16).map((d) => d.hours)
    const lvl = levelFor(overview.total_hours)
    const dvals = overview.daily.map((d) => d.hours)
    const recent = dvals.slice(-7).reduce((a, b) => a + b, 0)
    const prior = dvals.slice(-14, -7).reduce((a, b) => a + b, 0)
    const trend = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : 0
    return { peak, avg, spark, lvl, trend, achievements: achievements(overview) }
  }, [overview])

  // Per-campaign derived stats
  const campaignDerived = useMemo(() => {
    if (!summary) return null
    const peak = summary.daily.length ? Math.max(...summary.daily.map((d) => d.hours)) : 0
    const avg = summary.total_days ? summary.total_hours / summary.total_days : 0
    return { peak, avg }
  }, [summary])

  const chartData = useMemo(() => {
    if (!summary) return []
    if (period === 'daily') return summary.daily.map((d) => {
      const date = new Date(d.date + 'T00:00:00')
      const tooltip = date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
      return { label: d.date.slice(5), value: d.hours, tooltip }
    })
    if (period === 'weekly') return summary.weekly.map((d) => {
      const [year, week] = d.week.split('-W')
      return { label: `W${week}`, value: d.hours, tooltip: `${year} W${week}` }
    })
    return summary.monthly.map((d) => {
      const [y, m] = d.month.split('-')
      const name = new Date(y, m - 1).toLocaleString('en', { month: 'short' })
      return { label: `${name} '${y.slice(2)}`, value: d.hours, tooltip: `${name} ${y}` }
    })
  }, [summary, period])

  const selectedCampaign = campaigns.find((c) => String(c.id) === selected)

  return (
    <>
      {/* Topbar — greeting only, no campaign selector */}
      <div className="topbar">
        <div className="topbar-title">
          <h1>{greeting}, Spencer!</h1>
          <p>Your campaign performance at a glance</p>
        </div>
      </div>

      {/* ── SECTION 1: Portfolio Overview ─────────────────────────────────── */}
      <SectionHead title="Portfolio Overview" />

      {overviewLoading || !overview || !derived ? (
        <div className="empty"><div className="spinner" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="stat-grid">
            <StatCard index={0} icon={Clock} label="Total Hours" value={overview.total_hours} decimals={0} suffix=" h" accent="pink" trend={derived.trend} spark={derived.spark} />
            <StatCard index={1} icon={CalendarDays} label="Avg Hours / Day" value={derived.avg} decimals={1} accent="purple" spark={derived.spark} />
            <StatCard index={2} icon={Zap} label="Peak Day" value={derived.peak} decimals={1} suffix=" h" accent="amber" />
            <StatCard index={3} icon={Flame} label="Active Days" value={overview.total_days} accent="cyan" />
          </div>

          <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
            <motion.div className="card level-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <LevelRing level={derived.lvl.level} progress={derived.lvl.progress} />
              <div className="level-meta">
                <div className="level-row">
                  <h3>{derived.lvl.title}</h3>
                  <span className="level-tag">{derived.lvl.title}</span>
                </div>
                <p>{derived.lvl.blurb}</p>
                <div className="xp-track">
                  <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${derived.lvl.progress * 100}%` }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <div className="xp-text">
                  {derived.lvl.next
                    ? `${Math.round(overview.total_hours).toLocaleString()} / ${derived.lvl.next.min.toLocaleString()} h to ${derived.lvl.next.title}`
                    : 'Elite tier reached! 🏆'}
                </div>
              </div>
            </motion.div>

            <motion.div className="card card-pad" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              {(() => {
                const earnedCount = derived.achievements.filter((a) => a.earned).length
                const total = derived.achievements.length
                return (
                  <div className="badges-head">
                    <div style={{ fontSize: '.95rem', fontWeight: 700 }}>Achievements</div>
                    <span className="badges-count">
                      <span className="badges-count-num">{earnedCount}</span> / {total} unlocked
                    </span>
                  </div>
                )
              })()}
              <div className="badges">
                {derived.achievements.map((b, i) => (
                  <motion.div
                    key={b.name}
                    className={`badge ${b.earned ? 'earned' : 'locked'}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 + i * 0.05, type: 'spring', stiffness: 320, damping: 20 }}
                    tabIndex={0}
                  >
                    {b.earned && <span className="badge-check">✓</span>}
                    <div className="badge-ico">{b.icon}</div>
                    <div className="badge-name">{b.name}</div>
                    {!b.earned && (
                      <div className="badge-prog">
                        <div className="badge-prog-fill" style={{ width: `${b.progress * 100}%` }} />
                      </div>
                    )}
                    <div className="badge-tip" role="tooltip">
                      <div className="badge-tip-title">{b.name}</div>
                      <div className="badge-tip-hint">{b.hint}</div>
                      <div className="badge-tip-stat">
                        {b.earned
                          ? '✓ Unlocked'
                          : `${fmt(b.value, 0)} / ${fmt(b.target, 0)} ${b.unit} · ${Math.round(b.progress * 100)}%`}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ── SECTION 2: Campaign Detail ─────────────────────────────────────── */}
      <SectionHead title="Campaign Detail">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.85rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Select campaign:</span>
          <select className="input" style={{ width: 260 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Choose a campaign…</option>
            {[...campaigns].filter(c => c.total_hours > 0).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {[...campaigns].filter(c => c.total_hours <= 0).sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
              <option key={c.id} value={c.id} disabled style={{ color: 'var(--text-3)' }}>{c.name} (no data)</option>
            ))}
          </select>
        </div>
      </SectionHead>

      {!selected ? (
        <div className="empty" style={{ padding: '3rem 2rem' }}>
          <div className="empty-ico"><BarChart3 size={30} color="var(--primary-2)" /></div>
          <h2>Select a Campaign</h2>
          <p>Choose a campaign above to view its breakdown.</p>
        </div>
      ) : campaignLoading || !summary || !campaignDerived ? (
        <div className="empty"><div className="spinner" /></div>
      ) : (
        <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {/* Campaign stat cards */}
          <div className="stat-grid">
            <StatCard index={0} icon={Clock} label="Campaign Hours" value={summary.total_hours} decimals={0} suffix=" h" accent="pink" />
            <StatCard index={1} icon={CalendarDays} label="Avg Hours / Day" value={campaignDerived.avg} decimals={1} accent="purple" />
            <StatCard index={2} icon={Zap} label="Peak Day" value={campaignDerived.peak} decimals={1} suffix=" h" accent="amber" />
            <StatCard index={3} icon={Flame} label="Active Days" value={summary.total_days} accent="cyan" />
          </div>

          {/* Hours chart */}
          <motion.div className="card" style={{ marginBottom: '1.25rem' }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="card-head">
              <div>
                <h3>Hours Worked</h3>
                <div className="sub">{selectedCampaign?.name} · grouped by {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}</div>
              </div>
              <div className="seg">
                {PERIODS.map((p) => (
                  <button key={p.key} className={period === p.key ? 'active' : ''} onClick={() => setPeriod(p.key)}>{p.label}</button>
                ))}
              </div>
            </div>
            <div className="card-pad" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f4c44e" />
                      <stop offset="100%" stopColor="#e07a38" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval={period === 'daily' ? Math.ceil(chartData.length / 12) : 0} minTickGap={8} />
                  <YAxis tickLine={false} axisLine={false} width={42} tickFormatter={(v) => `${v}h`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={44} animationDuration={700}>
                    {chartData.map((_, i) => <Cell key={i} fill="url(#barGrad)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Heatmap */}
          <motion.div className="card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <div className="card-head">
              <div>
                <h3>Activity Heatmap</h3>
                <div className="sub">Daily hours intensity · {selectedCampaign?.name}</div>
              </div>
            </div>
            <div className="card-pad" style={{ overflowX: 'auto' }}>
              <Heatmap daily={summary.daily} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
