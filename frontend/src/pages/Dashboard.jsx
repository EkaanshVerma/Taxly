import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSession, getSessions, downloadXml, createSession } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import './Dashboard.css'

const TOTAL_STEPS = 12

export default function Dashboard() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('taxly_theme') || 'dark')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState(null) // most recent in_progress/complete/approved session
  const [history, setHistory] = useState([]) // past sessions, most recent first
  const [starting, setStarting] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('taxly_theme', next)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.backgroundColor = theme === 'dark' ? '#0A0E14' : '#F8FAF6'
  }, [theme])

  // ── Load dashboard data ─────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const userId = localStorage.getItem('taxly_user_id')
      if (!userId) {
        navigate('/login')
        return
      }

      const res = await getSessions(userId)
      const sessions = Array.isArray(res?.data) ? res.data : []
      sessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      const active = sessions.find(
        (s) => s.status === 'in_progress' || s.status === 'complete' || s.status === 'approved'
      )

      setCurrent(active || null)
      setHistory(sessions)
    } catch (err) {
      setError('Couldn\u2019t load your filing data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // ── Start a brand new filing ────────────────────────────────────────
  const startFiling = useCallback(async () => {
    if (starting) return
    setStarting(true)
    try {
      const userId = localStorage.getItem('taxly_user_id') || uuidv4()
      const res = await createSession(userId)
      const sid = res?.data?.session_id || uuidv4()
      navigate(`/chat/${sid}`)
    } catch {
      navigate(`/chat/${uuidv4()}`)
    } finally {
      setStarting(false)
    }
  }, [starting, navigate])

  const continueFiling = useCallback(() => {
    if (current?.id) navigate(`/chat/${current.id}`)
  }, [current, navigate])

  const handleDownload = useCallback(async (sessionId) => {
    setDownloadingId(sessionId)
    try {
      const res = await downloadXml(sessionId)
      const blob = new Blob([res.data], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taxly_itr_${sessionId}.xml`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Couldn\u2019t download your XML. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }, [])

  // ── Derived values ──────────────────────────────────────────────────
  const fmt = (n) => {
    if (n === null || n === undefined) return '\u20B90'
    return '\u20B9' + Math.round(Math.abs(n)).toLocaleString('en-IN')
  }

  const income = current?.income_data || null
  const hasIncomeData = !!(income && (income.gross_salary || income.net_taxable_income))
  const isFinalised = current?.status === 'complete' || current?.status === 'approved'

  const stepsAnswered = current?.messages
    ? Math.min(TOTAL_STEPS, Math.floor((current.messages.length || 0) / 2))
    : 0
  const progressPct = Math.round((stepsAnswered / TOTAL_STEPS) * 100)

  const lastBotQuestion = (() => {
    if (!current?.messages?.length) return ''
    const botMsgs = current.messages.filter((m) => m.role === 'model' || m.role === 'bot')
    const last = botMsgs[botMsgs.length - 1]
    const text = last?.parts?.[0] || last?.text || ''
    return text.length > 92 ? text.slice(0, 92) + '\u2026' : text
  })()

  const refundDue = income?.refund_due ?? null
  const isRefund = refundDue !== null && refundDue >= 0

  const statusPill = (status, paid) => {
    if (status === 'approved') return { label: 'Approved', cls: 'pill-ok' }
    if (status === 'complete') return { label: 'CA Review', cls: 'pill-run' }
    if (status === 'in_progress') return { label: 'In Progress', cls: 'pill-run' }
    return { label: status || 'Unknown', cls: 'pill-idle' }
  }

  const oldTax = income?.old_regime_tax
  const newTax = income?.new_regime_tax
  const showRegimeCompare = isFinalised && oldTax !== undefined && newTax !== undefined
  const oldWins = showRegimeCompare && oldTax <= newTax
  const regimeGap = showRegimeCompare ? Math.abs(oldTax - newTax) : 0

  const deductionRows = income
    ? [
        { label: 'Gross salary', value: income.gross_salary },
        { label: 'Standard deduction', value: income.standard_deduction, negative: true },
        { label: '80C deductions', value: income.deduction_80c, negative: true },
        { label: 'HRA exemption', value: income.hra_exemption, negative: true },
      ].filter((r) => r.value !== undefined && r.value !== null && r.value !== 0)
    : []

  const pastFilings = history.filter((s) => s.id !== current?.id)

  return (
    <div className={`dash-page theme-${theme}`} data-theme={theme}>
      {/* ══ NAV ══ */}
      <nav>
        <div className="nav-in">
          <Link to="/" className="brand" aria-label="Taxly Home">
            <img
              src={theme === 'light' ? '/logo-color.png' : '/logo-white.png'}
              alt="Taxly Logo"
              className="brand-logo-img"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
          </Link>
          <div className="nav-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle light and dark mode"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
            <Link to="/documents" className="btn btn-ghost">Documents</Link>
            <Link to="/profile" className="btn btn-ghost">Profile</Link>
          </div>
        </div>
      </nav>

      <div className="wrap dash-body">
        {/* ══ ERROR BANNER ══ */}
        {error && (
          <div className="dash-error">
            <span>{error}</span>
            <button onClick={loadDashboard} className="btn btn-line btn-sm">Retry</button>
          </div>
        )}

        {/* ══ LOADING SKELETON ══ */}
        {loading && (
          <>
            <div className="dash-stats">
              <div className="skel skel-stat" />
              <div className="skel skel-stat" />
              <div className="skel skel-stat" />
            </div>
            <div className="skel skel-card" />
          </>
        )}

        {!loading && (
          <>
            {/* ══ STATS ROW ══ */}
            {hasIncomeData && (
              <div className="dash-stats">
                <div className="dash-stat-card">
                  <span className="dash-stat-label">
                    {isRefund ? 'Estimated refund' : 'Estimated tax due'}
                  </span>
                  <span className={`dash-stat-num ${isRefund ? 'good' : 'bad'}`}>
                    {fmt(refundDue)}
                  </span>
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Filing status</span>
                  {(() => {
                    const p = statusPill(current?.status)
                    return <span className={`pill ${p.cls} dash-stat-pill`}>{p.label}</span>
                  })()}
                </div>
                <div className="dash-stat-card">
                  <span className="dash-stat-label">Assessment year</span>
                  <span className="dash-stat-num small">AY 2025\u201326</span>
                  <span className="dash-stat-sub">{income?.itr_type || 'ITR-1'}</span>
                </div>
              </div>
            )}

            {/* ══ CURRENT FILING CARD ══ */}
            {current ? (
              <div className="dash-card dash-filing-card rv">
                <div className="dash-filing-head">
                  <span className="dash-filing-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                    </svg>
                  </span>
                  <div>
                    <h3>{isFinalised ? 'Your filing' : 'Continue your filing'}</h3>
                    {!isFinalised && lastBotQuestion && (
                      <p className="dash-filing-preview">{lastBotQuestion}</p>
                    )}
                  </div>
                </div>

                {!isFinalised && (
                  <>
                    <div className="dash-progress-track">
                      <div className="dash-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="dash-progress-label">Step {stepsAnswered} of {TOTAL_STEPS}</span>
                  </>
                )}

                <button
                  onClick={continueFiling}
                  className="btn btn-fill"
                  style={{ marginTop: 18 }}
                >
                  {isFinalised ? 'View filing \u2192' : 'Continue Filing \u2192'}
                </button>
              </div>
            ) : (
              <div className="dash-card dash-empty-card rv">
                <span className="dash-empty-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 26, height: 26 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </span>
                <h3>No filing started yet</h3>
                <p>Takes about 20 minutes. Upload your Form 16 and we\u2019ll handle the rest.</p>
                <button onClick={startFiling} className="btn btn-fill" disabled={starting}>
                  {starting ? 'Starting\u2026' : 'Start ITR Filing \u2192'}
                </button>
              </div>
            )}

            {/* ══ TAX BREAKDOWN + REGIME COMPARISON ══ */}
            {isFinalised && hasIncomeData && (
              <div className="dash-twocol rv">
                <div className="dash-card">
                  <h3 className="dash-card-title">Tax breakdown</h3>
                  <div className="dash-breakdown">
                    {deductionRows.map((row) => (
                      <div className="dash-bd-row" key={row.label}>
                        <span>{row.label}</span>
                        <span>{row.negative ? '\u2212' : ''}{fmt(row.value)}</span>
                      </div>
                    ))}
                    {income?.net_taxable_income !== undefined && (
                      <div className="dash-bd-row">
                        <span>Net taxable income</span>
                        <span>{fmt(income.net_taxable_income)}</span>
                      </div>
                    )}
                    {income?.tax_payable !== undefined && (
                      <div className="dash-bd-row">
                        <span>Tax payable</span>
                        <span>{fmt(income.tax_payable)}</span>
                      </div>
                    )}
                    {income?.tds_paid !== undefined && (
                      <div className="dash-bd-row">
                        <span>TDS already paid</span>
                        <span>\u2212{fmt(income.tds_paid)}</span>
                      </div>
                    )}
                    <div className="dash-bd-row dash-bd-final">
                      <span>{isRefund ? 'Refund due' : 'Tax payable'}</span>
                      <span className={isRefund ? 'good' : 'bad'}>{fmt(refundDue)}</span>
                    </div>
                  </div>
                </div>

                {showRegimeCompare && (
                  <div className="dash-card">
                    <h3 className="dash-card-title">Regime comparison</h3>
                    <div className="dash-vs">
                      <div className={`vs-card ${oldWins ? 'win' : ''}`}>
                        <div className="vs-lab">OLD REGIME</div>
                        <div className="vs-amt">{fmt(oldTax)}</div>
                        {oldWins && <span className="vs-tag">Recommended</span>}
                      </div>
                      <div className={`vs-card ${!oldWins ? 'win' : ''}`}>
                        <div className="vs-lab">NEW REGIME</div>
                        <div className="vs-amt">{fmt(newTax)}</div>
                        {!oldWins && <span className="vs-tag">Recommended</span>}
                      </div>
                    </div>
                    <p className="dash-regime-note">
                      {regimeGap < 500
                        ? 'Both regimes work out almost identical for you.'
                        : `${oldWins ? 'Old' : 'New'} regime saves you ${fmt(regimeGap)}.`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ══ FILING HISTORY ══ */}
            <div className="dash-section rv">
              <h3 className="dash-section-title">Filing history</h3>
              {pastFilings.length === 0 ? (
                <p className="dash-muted">No past filings yet</p>
              ) : (
                <div className="dash-card dash-table-card">
                  <div className="dash-thead">
                    <span>Assessment Year</span>
                    <span>ITR Type</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {pastFilings.map((s) => {
                    const yr = s.created_at ? new Date(s.created_at).getFullYear() : '\u2014'
                    const p = statusPill(s.status)
                    const canDownload = s.payment_status === 'paid' && s.status === 'approved'
                    const amount = s.income_data?.refund_due
                    return (
                      <div className="dash-trow" key={s.id}>
                        <span>AY {yr - 1}\u2013{String(yr).slice(-2)}</span>
                        <span>{s.income_data?.itr_type || 'ITR-1'}</span>
                        <span><span className={`pill ${p.cls}`}>{p.label}</span></span>
                        <span>{amount !== undefined ? fmt(amount) : '\u2014'}</span>
                        <span>
                          <button
                            className="btn btn-line btn-sm"
                            disabled={!canDownload || downloadingId === s.id}
                            onClick={() => handleDownload(s.id)}
                          >
                            {downloadingId === s.id ? 'Downloading\u2026' : 'Download XML'}
                          </button>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
