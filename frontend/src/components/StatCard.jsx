import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import AnimatedNumber from './AnimatedNumber'

const ACCENTS = {
  pink:   { line: 'linear-gradient(90deg,#f4c44e,#e07a38)', ico: 'rgba(231,138,59,.15)', icoColor: '#f0a35a', stroke: '#f4c44e' },
  purple: { line: 'linear-gradient(90deg,#2f9e8c,#4cbfa9)', ico: 'rgba(47,158,140,.15)', icoColor: '#a7ddd2', stroke: '#2f9e8c' },
  amber:  { line: 'linear-gradient(90deg,#f0b95e,#e07a38)', ico: 'rgba(240,185,94,.15)', icoColor: '#f4cd6e', stroke: '#f0b95e' },
  cyan:   { line: 'linear-gradient(90deg,#4cbfa9,#5fa57a)', ico: 'rgba(76,191,169,.15)',  icoColor: '#6fd0bd', stroke: '#4cbfa9' },
}

export default function StatCard({ icon: Icon, label, value, decimals = 0, suffix = '', accent = 'pink', trend, spark, index = 0 }) {
  const a = ACCENTS[accent]
  const TrendIco = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendCls = trend == null ? '' : trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-flat'

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
    >
      <span className="accent-line" style={{ background: a.line }} />
      <div className="stat-top">
        <div className="stat-icon" style={{ background: a.ico, color: a.icoColor }}>
          <Icon />
        </div>
        {TrendIco && (
          <span className={`stat-trend ${trendCls}`}>
            <TrendIco /> {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stat-value">
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="stat-label">{label}</div>
      {spark && spark.length > 1 && (
        <div className="stat-spark">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`sp-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.stroke} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={a.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={a.stroke} strokeWidth={2} fill={`url(#sp-${accent})`} isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
