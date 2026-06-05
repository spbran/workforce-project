import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, BarChart3, ArrowRight } from 'lucide-react'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } } }

export default function Landing() {
  return (
    <div className="landing">
      <motion.div className="landing-inner" variants={container} initial="hidden" animate="show">
        <motion.h1 className="landing-title-shimmer" variants={item}>
          Spencer's Workforce<br />Delivery Platform
        </motion.h1>

        <motion.p className="landing-sub" variants={item}>
          Manage your agents, orchestrate campaign assignments, and track the
          KPIs that move your business — all in one place.
        </motion.p>

        <motion.div className="role-cards" variants={item}>
          <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Link to="/admin/agents" className="role-card rc--admin">
              <div className="rc-ico-wrap">
                <div className="rc-ico" style={{ background: 'linear-gradient(135deg,#f4c44e,#e07a38)' }}>
                  <Settings size={22} color="#fff" />
                </div>
              </div>
              <h3>Admin Portal</h3>
              <p>Manage agent properties and campaign assignments.</p>
              <span className="rc-go">Enter portal <ArrowRight size={15} /></span>
            </Link>
          </motion.div>

          <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Link to="/customer" className="role-card rc--customer">
              <div className="rc-ico-wrap">
                <div className="rc-ico" style={{ background: 'linear-gradient(135deg,#2f9e8c,#4cbfa9)' }}>
                  <BarChart3 size={22} color="#fff" />
                </div>
              </div>
              <h3>Customer Dashboard</h3>
              <p>Track hours worked by day, week, and month with live KPIs.</p>
              <span className="rc-go">View dashboard <ArrowRight size={15} /></span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
