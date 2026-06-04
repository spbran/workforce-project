import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import { api } from '../lib/api'

export default function Layout() {
  const [counts, setCounts] = useState({})
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const refresh = () =>
    api.overview().then((o) =>
      setCounts({ agents: o.agents_total, campaigns: o.campaigns_total })
    ).catch(() => {})

  useEffect(() => { refresh() }, [])
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <div className="app">
      <button className="menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {menuOpen && <div className="sidebar-scrim" onClick={() => setMenuOpen(false)} />}
      <Sidebar counts={counts} open={menuOpen} />
      <main className="main">
        <div className="page">
          <Outlet context={{ refreshCounts: refresh }} />
        </div>
      </main>
    </div>
  )
}
