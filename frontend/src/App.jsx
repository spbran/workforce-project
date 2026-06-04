import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import AdminAgents from './pages/AdminAgents'
import AdminCampaigns from './pages/AdminCampaigns'
import CustomerDashboard from './pages/CustomerDashboard'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/admin/agents" element={<AdminAgents />} />
            <Route path="/admin/campaigns" element={<AdminCampaigns />} />
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
