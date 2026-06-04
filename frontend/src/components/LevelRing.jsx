import { motion } from 'framer-motion'

export default function LevelRing({ level, progress }) {
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div className="ring-wrap">
      <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f4c44e" />
            <stop offset="100%" stopColor="#e07a38" />
          </linearGradient>
        </defs>
        <circle cx="52" cy="52" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
        <motion.circle
          cx="52" cy="52" r={R} fill="none"
          stroke="url(#ringGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - progress) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="ring-inner">
        <div className="ring-lvl">{level}</div>
        <div className="ring-cap">Level</div>
      </div>
    </div>
  )
}
