import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import SummaryPage from './pages/SummaryPage'
import LoginPage from './pages/LoginPage'
import CALoginPage from './pages/CALoginPage'
import CADashboardPage from './pages/CADashboardPage'
import UserDashboardPage from './pages/UserDashboardPage'

export default function App() {
  const [caToken, setCAToken] = useState(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chat/:sessionId" element={<ChatPage />} />
        <Route path="/summary/:sessionId" element={<SummaryPage />} />
        <Route path="/dashboard" element={<UserDashboardPage />} />
        
        <Route path="/ca/login" element={<CALoginPage setCAToken={setCAToken} />} />
        <Route path="/ca/dashboard" element={<CADashboardPage caToken={caToken} setCAToken={setCAToken} />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
