import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Donors from './pages/Donors'
import AtRiskQueue from './pages/AtRiskQueue'
import CampaignsPledges from './pages/CampaignsPledges'
import OutreachReview from './pages/OutreachReview'
import { Toaster } from './lib/shadcn/sonner'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/donors" element={<Donors />} />
        <Route path="/at-risk" element={<AtRiskQueue />} />
        <Route path="/campaigns" element={<CampaignsPledges />} />
        <Route path="/outreach" element={<OutreachReview />} />
      </Routes>
      <Toaster />
    </Layout>
  )
}
