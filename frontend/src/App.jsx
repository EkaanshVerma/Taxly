import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/ToastContext'

// Core app pages
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import UserDashboardPage from './pages/UserDashboardPage'
import ChatPage from './pages/ChatPage'
import SummaryPage from './pages/SummaryPage'
import ProfilePage from './pages/ProfilePage'
import DocumentsPage from './pages/DocumentsPage'

// CA pages
import CALoginPage from './pages/CALoginPage'
import CADashboardPage from './pages/CADashboardPage'
import CAClientDetailPage from './pages/CAClientDetailPage'

// Static pages
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

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function isTokenValid() {
  const token = localStorage.getItem('taxly_token')
  if (!token) return false
  try {
    const parts = token.split('.')
    if (parts.length < 2) return !!token // mock token
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('taxly_token')
      return false
    }
    return true
  } catch {
    return !!token // non-JWT mock token — treat as valid
  }
}

// Redirects to /login if JWT expired, preserving return URL
function RequireAuth({ children }) {
  const location = useLocation()
  if (!isTokenValid()) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return children
}

function RequireCAAuth({ children, caToken }) {
  if (!caToken) return <Navigate to="/ca/login" replace />
  return children
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [caToken, setCAToken] = useState(
    () => sessionStorage.getItem('ca_token') || null
  )

  // Persist CA token to sessionStorage
  function handleSetCAToken(t) {
    setCAToken(t)
    if (t) sessionStorage.setItem('ca_token', t)
    else sessionStorage.removeItem('ca_token')
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── User (auth-gated) ── */}
          <Route path="/dashboard" element={<RequireAuth><UserDashboardPage /></RequireAuth>} />
          <Route path="/chat/:sessionId" element={<RequireAuth><ChatPage /></RequireAuth>} />
          <Route path="/summary/:sessionId" element={<RequireAuth><SummaryPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />

          {/* ── CA Portal ── */}
          <Route path="/ca/login" element={<CALoginPage setCAToken={handleSetCAToken} />} />
          <Route path="/ca/dashboard" element={
            <RequireCAAuth caToken={caToken}>
              <CADashboardPage caToken={caToken} setCAToken={handleSetCAToken} />
            </RequireCAAuth>
          } />
          <Route path="/ca/client/:sessionId" element={
            <RequireCAAuth caToken={caToken}>
              <CAClientDetailPage caToken={caToken} />
            </RequireCAAuth>
          } />

          {/* ── Static ── */}
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

          {/* ── 404 ── */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}
