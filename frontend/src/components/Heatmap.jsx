import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['var(--surface-3)', 'rgba(231,138,59,.3)', 'rgba(231,138,59,.5)', 'rgba(231,138,59,.75)', '#f4c44e']

// daily: [{ date: 'YYYY-MM-DD', hours }]
export default function Heatmap({ daily }) {
  const [hover, setHover] = useState(null)

  const { weeks, max, monthLabels } = useMemo(() => {
    if (!daily.length) return { weeks: [], max: 0, monthLabels: [] }
    const map = new Map(daily.map((d) => [d.date, d.hours]))
    const max = Math.max(...daily.map((d) => d.hours))

    const first = new Date(daily[0].date + 'T00:00:00')
    const last = new Date(daily[daily.length - 1].date + 'T00:00:00')
    // back up to Sunday
    const start = new Date(first)
    start.setDate(start.getDate() - start.getDay())

    const weeks = []
    let cur = new Date(start)
    while (cur <= last) {
      const col = []
      for (let d = 0; d < 7; d++) {
        const iso = cur.toISOString().slice(0, 10)
        col.push({ date: iso, hours: map.has(iso) ? map.get(iso) : null })
        cur.setDate(cur.getDate() + 1)
      }
      weeks.push(col)
    }

    // month label at the first column of each new month —
    // only show if that specific month has at least one day with real data in this column
    let lastMonth = null
    const monthLabels = weeks.map((col) => {
      const m = col[0].date.slice(5, 7)
      if (m !== lastMonth) {
        lastMonth = m
        const hasMonthData = col.some(cell => cell.date.slice(5, 7) === m && cell.hours !== null)
        return hasMonthData ? new Date(col[0].date + 'T00:00:00').toLocaleString('en', { month: 'short' }) : null
      }
      return null
    })

    return { weeks, max, monthLabels }
  }, [daily])

  const bucket = (h) => {
    if (h == null) return -1
    if (h <= 0) return 0
    const r = h / max
    if (r < 0.25) return 1
    if (r < 0.5) return 2
    if (r < 0.75) return 3
    return 4
  }

  return (
    <div>
      <div className="heat-month-row">
        {weeks.map((_, wi) => (
          <div className="heat-month-label" key={wi}>{monthLabels[wi] ?? ''}</div>
        ))}
      </div>
      <div className="heatmap">
        {weeks.map((col, wi) => (
          <div className="heat-col" key={wi}>
            {col.map((cell, di) => {
              const b = bucket(cell.hours)
              return (
                <motion.div
                  key={di}
                  className="heat-cell"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: b < 0 ? 0.15 : 1, scale: 1 }}
                  transition={{ delay: (wi * 7 + di) * 0.0015, duration: 0.2 }}
                  style={{ background: b < 0 ? 'transparent' : COLORS[b] }}
                  onMouseEnter={() => cell.hours != null && setHover(cell)}
                  onMouseLeave={() => setHover(null)}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span>{hover ? `${hover.date}: ${hover.hours.toFixed(1)} h` : 'Less'}</span>
        {!hover && (
          <span className="scale">
            {COLORS.map((c, i) => <span key={i} style={{ background: c }} />)}
          </span>
        )}
        {!hover && <span>More</span>}
      </div>
    </div>
  )
}
