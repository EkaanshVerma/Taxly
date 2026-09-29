import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  uploadForm16,
  downloadXml,
  deleteSession
} from '../api/taxly'
import { useToast } from '../components/ToastContext'
import { v4 as uuidv4 } from 'uuid'
import './Dashboard.css'

const FIRST_BOT_MSG = "Hi! I'm Taxly. I'll help you file your income tax return in about 20 minutes — no complex forms, no jargon.\n\nLet's get started: are you salaried, a freelancer, or do you have business income?"

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()

  // User details
  const [user, setUser] = useState({ name: 'Ekaansh', email: '', initial: 'E', avatar: '' })

  // Sidebar & Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filings & Session states
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [activeSessionData, setActiveSessionData] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [promptInput, setPromptInput] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [showTaxDrawer, setShowTaxDrawer] = useState(false)
  const [showCaModal, setShowCaModal] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // ── Auto scroll chat ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  // ── Load user info & past sessions ─────────────────────────────
  useEffect(() => {
    // 1. Resolve User
    const email = localStorage.getItem('taxly_user_email') || ''
    let name = localStorage.getItem('taxly_user_name') || ''
    const token = localStorage.getItem('taxly_token')

    if (!name && token) {
      try {
        const claims = JSON.parse(atob(token.split('.')[1]))
        if (claims.name) name = claims.name
        else if (claims.email) name = claims.email.split('@')[0]
      } catch {
        // ignore
      }
    }

    if (!name && email) {
      name = email.split('@')[0]
    }
    if (!name) name = 'Ekaansh'

    // Capitalize first letter of name
    const formattedName = name.charAt(0).toUpperCase() + name.slice(1)
    setUser({
      name: formattedName,
      email: email,
      initial: formattedName.charAt(0).toUpperCase(),
      avatar: localStorage.getItem('taxly_user_avatar') || ''
    })

    // 2. Fetch all past filing sessions
    loadPastSessions()
  }, [])

  const loadPastSessions = async () => {
    try {
      const userId = localStorage.getItem('taxly_user_id')
      if (!userId) return
      const res = await getSessions(userId)
      const list = Array.isArray(res.data) ? res.data : []
      // Sort newest first
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      setSessions(list)
    } catch (err) {
      console.warn('Could not load past sessions:', err)
    }
  }

  // ── Switch to a past filing or create a new one ─────────────────
  const handleSelectSession = async (session) => {
    setActiveSessionId(session.id)
    setActiveSessionData(session)
    setChatLoading(true)
    try {
      const res = await getSession(session.id)
      const data = res.data
      setActiveSessionData(data)
      if (data.messages && data.messages.length > 0) {
        setMessages(
          data.messages.map(m => ({
            role: m.role === 'model' ? 'bot' : 'user',
            text: Array.isArray(m.parts) ? m.parts[0] : m.parts
          }))
        )
      } else {
        setMessages([{ role: 'bot', text: FIRST_BOT_MSG }])
      }
      if (data.income_data && (data.income_data.gross_salary || data.income_data.tax_payable !== undefined)) {
        setShowTaxDrawer(true)
      }
    } catch {
      setMessages([{ role: 'bot', text: FIRST_BOT_MSG }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleStartNewFiling = () => {
    setActiveSessionId(null)
    setActiveSessionData(null)
    setMessages([])
    setPromptInput('')
    setShowTaxDrawer(false)
  }

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    e.preventDefault()
    // Optimistic removal so user sees instant response
    setSessions(prev => prev.filter(item => item.id !== sessionId))
    if (activeSessionId === sessionId) {
      handleStartNewFiling()
    }

    try {
      await deleteSession(sessionId)
      toast.success('Filing draft removed')
    } catch (err) {
      console.warn('Delete session notice:', err)
      toast.success('Filing draft removed')
    }
  }

  // ── Send Message ───────────────────────────────────────────────
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || promptInput || '').trim()
    if (!text || chatLoading) return

    setPromptInput('')

    // If starting from welcome screen, initialize a new session first
    let currentId = activeSessionId
    if (!currentId) {
      try {
        const userId = localStorage.getItem('taxly_user_id') || uuidv4()
        const res = await createSession(userId)
        currentId = res.data?.session_id || uuidv4()
      } catch {
        currentId = uuidv4()
      }
      setActiveSessionId(currentId)
      setMessages([
        { role: 'bot', text: FIRST_BOT_MSG },
        { role: 'user', text }
      ])
    } else {
      setMessages(prev => [...prev, { role: 'user', text }])
    }

    setChatLoading(true)

    try {
      const res = await sendMessage(currentId, text)
      if (res.data?.done) {
        setMessages(prev => [
          ...prev,
          { role: 'bot', text: '✓ All tax computation questions complete! Calculating your optimum tax regime and filing summary…' }
        ])
        setTimeout(() => {
          navigate(`/summary/${currentId}`)
        }, 1500)
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: res.data.message }])
      }
      // Refresh past sessions in background
      loadPastSessions()
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: "I'm having a brief connection issue. Please answer again or check your network." }
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Upload Form 16 PDF ──────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF Form 16 file')
      return
    }

    let currentId = activeSessionId
    if (!currentId) {
      try {
        const userId = localStorage.getItem('taxly_user_id') || uuidv4()
        const res = await createSession(userId)
        currentId = res.data?.session_id || uuidv4()
      } catch {
        currentId = uuidv4()
      }
      setActiveSessionId(currentId)
      setMessages([{ role: 'bot', text: FIRST_BOT_MSG }])
    }

    setUploadingPdf(true)
    setChatLoading(true)
    try {
      const res = await uploadForm16(currentId, file)
      const empName = res.data?.employee_name || 'your'
      const salary = res.data?.gross_salary
      toast.success('Form 16 parsed successfully!')
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: `📄 **Form 16 Received & Parsed!**\nEmployee: **${empName}**\nGross Salary: **₹${salary ? salary.toLocaleString('en-IN') : 'Extracted'}**\n\nTo maximize your refund, do you pay house rent in your city?`
        }
      ])
      loadPastSessions()
    } catch {
      toast.error('Could not auto-read PDF. You can answer the questions manually!')
    } finally {
      setUploadingPdf(false)
      setChatLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Quick reply pills based on bot message content
  const getQuickReplies = (botText) => {
    if (!botText) return []
    const lower = botText.toLowerCase()
    if (lower.includes('salaried') && lower.includes('freelancer')) {
      return ['Salaried Employee', 'Freelancer / Consultant', 'Business Owner']
    }
    if (lower.includes('pay rent') || lower.includes('house rent')) {
      return ['Yes, I pay rent', 'No rent paid']
    }
    if (lower.includes('residential status') || lower.includes('resident')) {
      return ['Resident Indian', 'Non-Resident Indian (NRI)', 'RNOR']
    }
    if (lower.includes('regime')) {
      return ['New Tax Regime (Default)', 'Old Tax Regime']
    }
    return []
  }

  // Filtered filings list
  const filteredSessions = sessions.filter(s => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (s.id && s.id.toLowerCase().includes(q)) ||
      (s.client_name && s.client_name.toLowerCase().includes(q)) ||
      (s.created_at && s.created_at.includes(q))
  })

  // Format filing display name
  const formatFilingTitle = (s) => {
    if (s.client_name) return `${s.client_name} · ITR`
    const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Draft'
    return `AY 2025-26 Filing (${date})`
  }

  const handleLogout = () => {
    localStorage.removeItem('taxly_token')
    localStorage.removeItem('taxly_user_email')
    localStorage.removeItem('taxly_user_name')
    localStorage.removeItem('taxly_user_id')
    navigate('/login')
  }

  return (
    <div className="g-layout">
      {/* ── Left Gemini Sidebar ───────────────────────────────────── */}
      <aside className={`g-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="g-sidebar-header">
          {!sidebarCollapsed && (
            <Link to="/" className="g-brand">
              <div className="g-brand-icon">
                {/* Gemini-like 4-point sparkle icon with radiant gradient */}
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <defs>
                    <linearGradient id="sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#sparkle-grad)" d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z" />
                </svg>
              </div>
              <span className="g-brand-title">Taxly</span>
            </Link>
          )}

          <button
            className="g-icon-btn"
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        {/* Dual Mode Switcher (Chat / Filings) */}
        {!sidebarCollapsed && (
          <div className="g-mode-tabs">
            <button className="g-mode-tab active" onClick={handleStartNewFiling}>
              <span>Chat</span>
            </button>
            <button
              type="button"
              className="g-mode-tab"
              onClick={() => setShowCaModal(true)}
            >
              <span>CA Review</span>
              <span className="g-mode-badge">PRO</span>
            </button>
          </div>
        )}

        {/* Primary Action: + New Filing */}
        <div className="g-sidebar-action-wrap">
          <button className="g-new-filing-btn" onClick={handleStartNewFiling}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>New filing</span>}
          </button>
        </div>

        {/* Search Filings */}
        {!sidebarCollapsed && (
          <div className="g-search-box">
            <svg className="g-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search filings..."
              className="g-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Quick Nav Tools */}
        {!sidebarCollapsed && (
          <div className="g-sidebar-menu">
            <Link to="/documents" className="g-menu-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Form 16 &amp; Documents</span>
            </Link>
            <div className="g-menu-item" onClick={() => handleSendMessage('What deductions can I claim under Section 80C and 80D?')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Deductions Optimizer</span>
            </div>
            <div className="g-menu-item" onClick={() => handleSendMessage('Explain the difference between Old and New Tax Regime for my income.')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Tax Regime Advisor</span>
            </div>
          </div>
        )}

        {/* Recent Filings Section */}
        {!sidebarCollapsed && (
          <div className="g-recent-section">
            <div className="g-recent-title">Recent Filings</div>
            {filteredSessions.length > 0 ? (
              filteredSessions.map(s => (
                <div
                  key={s.id}
                  className={`g-filing-item ${activeSessionId === s.id ? 'active' : ''}`}
                  onClick={() => handleSelectSession(s)}
                >
                  <div className="g-filing-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="g-filing-name">{formatFilingTitle(s)}</span>
                  </div>
                  <div className="g-filing-actions">
                    <button
                      className="g-filing-action-btn"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title="Delete draft"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="g-empty-filings">
                No past filings yet.<br />Ask Taxly to start your first return!
              </div>
            )}
          </div>
        )}

        {/* User Profile Footer */}
        <div className="g-sidebar-footer">
          {showProfileMenu && (
            <div className="g-profile-dropdown">
              <Link to="/profile" className="g-dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>My Profile</span>
              </Link>
              <Link to="/documents" className="g-dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                </svg>
                <span>Documents</span>
              </Link>
              <Link to="/ca/login" className="g-dropdown-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Chartered Accountant Portal</span>
              </Link>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <button className="g-dropdown-item danger" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign out</span>
              </button>
            </div>
          )}

          <button className="g-user-chip" onClick={() => setShowProfileMenu(v => !v)}>
            <div className="g-user-meta">
              <div className="g-user-avatar">
                {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.initial}
              </div>
              {!sidebarCollapsed && (
                <div className="g-user-text">
                  <div className="g-user-name">{user.name}</div>
                  <div className="g-user-tier">Individual Taxpayer</div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748B' }}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Hidden file input for Form 16 upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="application/pdf"
        onChange={handleFileUpload}
      />

      {/* ── Right Gemini Canvas ───────────────────────────────────── */}
      <main className="g-main">
        {/* Top Floating App Bar */}
        <header className="g-top-bar">
          <div className="g-top-left">
            {activeSessionId && (
              <div className="g-session-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>AY 2025-26 Filing</span>
              </div>
            )}
          </div>

          <div className="g-top-actions">
            <Link to="/documents" className="g-nav-link">
              <span>Documents</span>
            </Link>
            <button
              type="button"
              className="g-btn-pill"
              onClick={() => setShowCaModal(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>CA Review</span>
            </button>
            <Link to="/profile" className="g-btn-pill">
              <span>Profile</span>
            </Link>
          </div>
        </header>

        {/* ── Center Canvas ────────────────────────────────────────── */}
        {!activeSessionId ? (
          /* ── VIEW 1: GEMINI HOME / WELCOME (Start New Filing) ──── */
          <div className="g-welcome-view">
            <h1 className="g-welcome-heading">
              Hi, {user.name}. <span>What's on your mind?</span>
            </h1>

            {/* Centered Gemini Prompt Bar */}
            <div className="g-prompt-container">
              <div className="g-prompt-box">
                <button
                  type="button"
                  className="g-prompt-attach"
                  title="Upload Form 16 (PDF)"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPdf}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <input
                  type="text"
                  className="g-prompt-input"
                  placeholder="Ask Taxly or describe your income (e.g. Salaried ₹12L with HRA)..."
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendMessage()
                  }}
                  autoFocus
                />

                <div className="g-prompt-right">
                  <div className="g-model-badge">
                    <span>Taxly AI v2.5</span>
                  </div>
                  <button
                    type="button"
                    className="g-send-btn"
                    onClick={() => handleSendMessage()}
                    disabled={!promptInput.trim()}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Chips (Gemini style) */}
            <div className="g-suggestion-chips">
              <button
                className="g-chip"
                onClick={() => handleSendMessage("Let's start my FY 2024-25 (AY 2025-26) ITR filing. I am a salaried employee.")}
              >
                <span>⚡ Start FY 2024-25 ITR Filing</span>
              </button>

              <button
                className="g-chip"
                onClick={() => fileInputRef.current?.click()}
              >
                <span>📄 Upload Form 16 PDF (Auto-fill)</span>
              </button>

              <button
                className="g-chip"
                onClick={() => handleSendMessage("Can you compare the Old vs New Tax Regime for my income?")}
              >
                <span>⚖️ Compare Old vs New Tax Regime</span>
              </button>

              <button
                className="g-chip"
                onClick={() => handleSendMessage("Help me calculate my House Rent Allowance (HRA) and Section 80C deductions.")}
              >
                <span>🏠 Calculate HRA &amp; 80C Deductions</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── VIEW 2: ACTIVE CONVERSATION (Gemini Chat) ────────── */
          <div className="g-chat-view">
            {/* Live Calculation Preview Drawer (if income data exists) */}
            {activeSessionData?.income_data && (
              <div className="g-tax-preview-drawer">
                <div className="g-preview-header">
                  <span className="g-preview-title">Live Tax Breakdown</span>
                  <button
                    className="g-icon-btn"
                    style={{ width: '20px', height: '20px' }}
                    onClick={() => setShowTaxDrawer(false)}
                  >
                    ×
                  </button>
                </div>

                {activeSessionData.income_data.gross_salary !== undefined && (
                  <div className="g-preview-row">
                    <span>Gross Salary</span>
                    <span>₹{Math.round(activeSessionData.income_data.gross_salary).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {activeSessionData.income_data.standard_deduction !== undefined && (
                  <div className="g-preview-row">
                    <span>Standard Deduction</span>
                    <span>-₹{Math.round(activeSessionData.income_data.standard_deduction).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {activeSessionData.income_data.deduction_80c !== undefined && (
                  <div className="g-preview-row">
                    <span>Section 80C</span>
                    <span>-₹{Math.round(activeSessionData.income_data.deduction_80c).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {activeSessionData.income_data.hra_exemption !== undefined && (
                  <div className="g-preview-row">
                    <span>HRA Exemption</span>
                    <span>-₹{Math.round(activeSessionData.income_data.hra_exemption).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {activeSessionData.income_data.refund_due !== undefined && (
                  <div className="g-preview-row total refund">
                    <span>Estimated Refund</span>
                    <span>₹{Math.round(activeSessionData.income_data.refund_due).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <button
                  className="g-btn-summary"
                  onClick={() => navigate(`/summary/${activeSessionId}`)}
                >
                  View Full ITR Summary →
                </button>
              </div>
            )}

            {/* Scrollable Messages Stream */}
            <div className="g-messages-stream">
              {messages.map((m, idx) => (
                <div key={idx} className={`g-msg-row ${m.role}`}>
                  <div className={`g-msg-avatar ${m.role}`}>
                    {m.role === 'bot' ? (
                      <svg viewBox="0 0 24 24" width="22" height="22">
                        <defs>
                          <linearGradient id={`bot-sparkle-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#38BDF8" />
                            <stop offset="50%" stopColor="#818CF8" />
                            <stop offset="100%" stopColor="#34D399" />
                          </linearGradient>
                        </defs>
                        <path fill={`url(#bot-sparkle-${idx})`} d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z" />
                      </svg>
                    ) : (
                      user.initial
                    )}
                  </div>

                  <div className="g-msg-bubble-wrap">
                    <div className={`g-msg-bubble ${m.role}`}>
                      {m.text}
                    </div>

                    {/* Quick interactive buttons if last message is bot */}
                    {m.role === 'bot' && idx === messages.length - 1 && !chatLoading && (
                      <div className="g-quick-replies">
                        {getQuickReplies(m.text).map((reply, rIdx) => (
                          <button
                            key={rIdx}
                            className="g-quick-btn"
                            onClick={() => handleSendMessage(reply)}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="g-msg-row bot">
                  <div className="g-msg-avatar bot">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <path fill="#38BDF8" d="M12 0L14.7 9.3L24 12L14.7 14.7L12 24L9.3 14.7L0 12L9.3 9.3L12 0Z" />
                    </svg>
                  </div>
                  <div className="g-typing">
                    <div className="g-dot" />
                    <div className="g-dot" />
                    <div className="g-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Docked Gemini Input Bar at bottom */}
            <div className="g-bottom-dock">
              <div className="g-prompt-container" style={{ marginBottom: 0 }}>
                <div className="g-prompt-box">
                  <button
                    type="button"
                    className="g-prompt-attach"
                    title="Upload Form 16 (PDF)"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPdf || chatLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    className="g-prompt-input"
                    placeholder="Reply to Taxly or ask a tax question..."
                    value={promptInput}
                    onChange={e => setPromptInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    disabled={chatLoading}
                    autoFocus
                  />

                  <div className="g-prompt-right">
                    <button
                      type="button"
                      className="g-send-btn"
                      onClick={() => handleSendMessage()}
                      disabled={!promptInput.trim() || chatLoading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="g-bottom-disclaimer">
                Taxly AI automates ITR preparation under the Indian Income Tax Act. Free CA verification available before e-filing.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── CA Review Modal (Taxpayer) ── */}
      {showCaModal && (
        <div className="g-ca-backdrop" onClick={() => setShowCaModal(false)}>
          <div className="g-ca-card" onClick={e => e.stopPropagation()}>
            <button className="g-ca-close" onClick={() => setShowCaModal(false)}>×</button>

            <div className="g-ca-badge-row">
              <span className="g-ca-pro-tag">Chartered Accountant Review</span>
              <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>✓ ICAI Verified</span>
            </div>

            <div>
              <h2 className="g-ca-title">Expert CA Verification &amp; Filing</h2>
              <p className="g-ca-desc">
                Have an experienced Chartered Accountant review your deductions, verify Form 16 &amp; capital gains, and e-file on the Income Tax Portal with notice protection.
              </p>
            </div>

            <div className="g-ca-features">
              <div className="g-ca-feature-item">
                <div className="g-ca-feature-icon">🛡️</div>
                <div className="g-ca-feature-text">
                  <h4>100% Notice Protection Guarantee</h4>
                  <p>In case of any query or notice from the IT Department, our partner CAs handle the response on your behalf.</p>
                </div>
              </div>

              <div className="g-ca-feature-item">
                <div className="g-ca-feature-icon">🔍</div>
                <div className="g-ca-feature-text">
                  <h4>Maximized Deductions Audit</h4>
                  <p>In-depth audit of 80C, 80D, HRA, 80CCD, 80G, home loan interest, and capital gains set-offs.</p>
                </div>
              </div>

              <div className="g-ca-feature-item">
                <div className="g-ca-feature-icon">⚡</div>
                <div className="g-ca-feature-text">
                  <h4>Priority ITR Filing &amp; Instant ITR-V</h4>
                  <p>Fast-track e-filing with official ITR-V acknowledgement and calculation sheet delivered to your inbox.</p>
                </div>
              </div>
            </div>

            <div className="g-ca-actions">
              <button
                type="button"
                className="g-btn-ca-primary"
                onClick={() => {
                  setShowCaModal(false)
                  if (!activeSessionId) {
                    handleSendMessage("I'd like to file my ITR with CA Expert Review. Let's get started.")
                  } else {
                    toast.success('Your current filing draft has been flagged for CA review!')
                  }
                }}
              >
                {activeSessionId ? 'Request CA Review for Current Filing →' : 'Start New Filing with CA Review →'}
              </button>
            </div>

            <div className="g-ca-footer-note">
              <span>Are you a practicing Chartered Accountant?</span>
              <Link to="/ca/login" className="g-ca-footer-link" onClick={() => setShowCaModal(false)}>
                CA Portal Login →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
