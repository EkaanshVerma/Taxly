import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Home from './pages/Home'
import ChatPage from './pages/ChatPage'
import SummaryPage from './pages/SummaryPage'
import LoginPage from './pages/LoginPage'
import CALoginPage from './pages/CALoginPage'
import CADashboardPage from './pages/CADashboardPage'
import UserDashboardPage from './pages/UserDashboardPage'

// Static Pages
import PricingPage from './pages/static/PricingPage'
import AIExplainerPage from './pages/static/AIExplainerPage'
import SecurityPage from './pages/static/SecurityPage'
import PrivacyPolicyPage from './pages/static/PrivacyPolicyPage'
import TermsAndConditionsPage from './pages/static/TermsAndConditionsPage'
import RefundPolicyPage from './pages/static/RefundPolicyPage'
import GrievancePage from './pages/static/GrievancePage'
import ForCAsPage from './pages/static/ForCAsPage'
import ForCAsApplyPage from './pages/static/ForCAsApplyPage'
import PricingWhichTierPage from './pages/static/PricingWhichTierPage'
import NRIPage from './pages/static/NRIPage'
import GuideITR1vs2Page from './pages/static/GuideITR1vs2Page'
import GuideOldVsNewPage from './pages/static/GuideOldVsNewPage'
import GuideNRIPage from './pages/static/GuideNRIPage'
import GuideAIPage from './pages/static/GuideAIPage'
import NotFoundPage from './pages/static/NotFoundPage'

export default function App() {
  const [caToken, setCAToken] = useState(null)

  return (
    <BrowserRouter>
      <SpeedInsights />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat/:sessionId" element={<ChatPage />} />
        <Route path="/summary/:sessionId" element={<SummaryPage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />
        
        <Route path="/ca/login" element={<CALoginPage setCAToken={setCAToken} />} />
        <Route path="/ca/dashboard" element={<CADashboardPage caToken={caToken} setCAToken={setCAToken} />} />
        
        {/* Static Routes */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/pricing/which-tier" element={<PricingWhichTierPage />} />
        <Route path="/features/bank-statement-review" element={<AIExplainerPage />} />
        <Route path="/security" element={<SecurityPage />} />
        
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/grievance" element={<GrievancePage />} />
        
        <Route path="/for-cas" element={<ForCAsPage />} />
        <Route path="/for-cas/apply" element={<ForCAsApplyPage />} />
        <Route path="/nri" element={<NRIPage />} />
        
        <Route path="/guides/itr-1-vs-itr-2" element={<GuideITR1vs2Page />} />
        <Route path="/guides/old-vs-new-regime-2025" element={<GuideOldVsNewPage />} />
        <Route path="/guides/old-vs-new" element={<Navigate to="/guides/old-vs-new-regime-2025" />} />
        <Route path="/guides/nri-tax-filing-india" element={<GuideNRIPage />} />
        <Route path="/guides/how-tax-deduction-ai-works" element={<GuideAIPage />} />
        
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </BrowserRouter>
  )
}
