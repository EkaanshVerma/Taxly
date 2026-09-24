import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions, getSession, createSession, downloadXml } from '../api/taxly'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'

const AY_LABEL = { '2526': 'AY 2025–26', '2425': 'AY 2024–25' }
const TOTAL_STEPS = 12

const STATUS_META = {
  complete:    { bg: '#DCFCE7', text: '#166534', label: 'Filed' },
  approved:    { bg: '#DCFCE7', text: '#166534', label: 'Approved' },
  in_progress: { bg: '#FEF9C3', text: '#854D0E', label: 'In Progress' },
  ca_review:   { bg: '#DBEAFE', text: '#1E40AF', label: 'CA Review' },
  pending:     { bg: '#F1F5F9', text: '#475569', label: 'Pending' },
}

function fmtINR(n) {
  if (n == null || isNaN(n)) return '—'
  return '₹' + Math.abs(Number(n)).toLocaleString('en-IN')
}

function fmtDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending
  return <span className="d-pill" style={{ background: meta.bg, color: meta.text }}>{meta.label}</span>
}

function SkeletonCard({ height = 140 }) {
  return <div className="d-skeleton" style={{ height }} />
}

function ErrorBanner({ onRetry }) {
  return (
    <div className="d-error-banner">
      <span>⚠ Couldn't load your filing data. Please refresh.</span>
      <button className="d-error-retry" onClick={onRetry}>Retry</button>
    </div>
  )
}

function EmptyFilingCard({ onStart, starting }) {
  return (
    <div className="d-empty-card">
      <div className="d-empty-icon">📋</div>
      <h2>Start your first filing</h2>
      <p>Taxly will guide you through a quick 20-minute conversation — no forms, no jargon.</p>
      <button className="d-start-btn" onClick={onStart} disabled={starting}>
        {starting ? 'Starting…' : 'Start ITR Filing'}
      </button>
    </div>
  )
}

function ActiveFilingCard({ session, onContinue }) {
  const msgCount = session.messages?.length ?? 0
  const answered = Math.min(msgCount, TOTAL_STEPS)
  const pct = Math.round((answered / TOTAL_STEPS) * 100)
  const lastBotMsg = [...(session.messages || [])].reverse()
    .find(m => m.role === 'assistant' || m.sender === 'bot')
  const preview = lastBotMsg?.content || lastBotMsg?.text || 'Filing in progress…'

  return (
    <div className="d-active-card">
      <div className="d-progress-track">
        <div className="d-progress-fill" style={{ width: pct + '%' }} />
      </div>
      <div className="d-active-body">
        <div className="d-active-left">
          <div className="d-active-ay">✏️ {AY_LABEL['2526']}</div>
          <div className="d-active-step">Step {answered} of {TOTAL_STEPS}</div>
          <p className="d-active-preview">"{preview}"</p>
        </div>
        <div className="d-active-right">
          <StatusPill status={session.status || 'in_progress'} />
          <button className="d-continue-btn" onClick={onContinue}>Continue Filing →</button>
        </div>
      </div>
    </div>
  )
}

function StatsRow({ session, breakdown }) {
  const isRefund = (breakdown?.refund ?? 0) >= 0
  return (
    <div className="d-stats-row">
      <div className="d-stat-card">
        <div className="d-stat-label">{isRefund ? 'Estimated refund' : 'Estimated tax due'}</div>
        <div className="d-stat-value" style={{ color: isRefund ? '#0D7A5F' : '#DC2626' }}>
          {fmtINR(breakdown?.refund ?? breakdown?.tax_payable)}
        </div>
      </div>
      <div className="d-stat-card">
        <div className="d-stat-label">Filing status</div>
        <div style={{ marginTop: 8 }}><StatusPill status={session.status || 'in_progress'} /></div>
      </div>
      <div className="d-stat-card">
        <div className="d-stat-label">Assessment year</div>
        <div className="d-stat-value" style={{ color: '#0f172a' }}>{AY_LABEL['2526']}</div>
        <div className="d-stat-sub">{breakdown?.itr_type || 'ITR-1'}</div>
      </div>
    </div>
  )
}

function TaxBreakdownCard({ breakdown }) {
  const rows = [
    { label: 'Gross salary',       value:  breakdown.gross_salary,       bold: false },
    breakdown.standard_deduction ? { label: 'Standard deduction', value: -breakdown.standard_deduction, bold: false } : null,
    breakdown.deduction_80c      ? { label: '80C deductions',     value: -breakdown.deduction_80c,      bold: false } : null,
    breakdown.hra_exemption      ? { label: 'HRA exemption',      value: -breakdown.hra_exemption,       bold: false } : null,
    { label: 'Net taxable income', value:  breakdown.net_taxable,        bold: true  },
    { label: 'Tax payable',        value:  breakdown.tax_payable,        bold: false },
    { label: 'TDS already paid',   value: -breakdown.tds_paid,           bold: false },
  ].filter(Boolean)

  const isRefund = (breakdown.refund ?? 0) >= 0

  return (
    <div className="d-card" style={{ marginTop: 24 }}>
      <div className="d-card-title">Tax breakdown</div>
      <div className="d-breakdown-list">
        {rows.map((r, i) => (
          <div key={i} className="d-breakdown-row" style={{ fontWeight: r.bold ? 700 : 400 }}>
            <span>{r.label}</span>
            <span style={{ color: r.value < 0 ? '#DC2626' : '#0f172a' }}>
              {r.value < 0 ? '–' + fmtINR(r.value) : fmtINR(r.value)}
            </span>
          </div>
        ))}
        <div className="d-breakdown-row d-breakdown-final">
          <span>{isRefund ? 'Refund due' : 'Tax payable'}</span>
          <span style={{ color: isRefund ? '#0D7A5F' : '#DC2626', fontSize: 20 }}>
            {fmtINR(isRefund ? breakdown.refund : breakdown.tax_payable)}
          </span>
        </div>
      </div>
    </div>
  )
}

function RegimeComparisonCard({ breakdown }) {
  const recommended = breakdown.recommended_regime ||
    (breakdown.old_regime_tax <= breakdown.new_regime_tax ? 'old' : 'new')
  const saving = Math.abs((breakdown.old_regime_tax || 0) - (breakdown.new_regime_tax || 0))
  const cheaperLabel = recommended === 'old' ? 'Old regime' : 'New regime'

  function RegimeBox({ id, label, tax }) {
    const isRec = recommended === id
    return (
      <div className={'d-regime-box' + (isRec ? ' d-regime-recommended' : '')}>
        {isRec && <span className="d-regime-badge">Recommended</span>}
        <div className="d-regime-label">{label}</div>
        <div className="d-regime-tax">{fmtINR(tax)}</div>
      </div>
    )
  }

  return (
    <div className="d-card" style={{ marginTop: 16 }}>
      <div className="d-card-title">Regime comparison</div>
      <div className="d-regime-row">
        <RegimeBox id="old" label="Old regime" tax={breakdown.old_regime_tax} />
        <RegimeBox id="new" label="New regime" tax={breakdown.new_regime_tax} />
      </div>
      <p className="d-regime-hint">{cheaperLabel} saves you {fmtINR(saving)} vs the other regime.</p>
    </div>
  )
}

function FilingHistorySection({ sessions, onDownload }) {
  if (!sessions.length) return (
    <div style={{ marginTop: 32 }}>
      <div className="d-section-label">Filing History</div>
      <div className="d-card" style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8', fontSize: 14 }}>
        No past filings yet
      </div>
    </div>
  )
  return (
    <div style={{ marginTop: 32 }}>
      <div className="d-section-label">Filing History</div>
      <div className="d-table-wrap">
        <table className="d-table">
          <thead>
            <tr>
              <th>Assessment Year</th>
              <th>ITR Type</th>
              <th>Status</th>
              <th>Refund / Tax</th>
              <th>Filed On</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(s => {
              const canDownload = (s.status === 'complete' || s.status === 'approved') && s.payment_status === 'paid'
              const taxAmt = s.tax_amount ?? s.income_data?.refund ?? 0
              const isRefund = taxAmt <= 0
              return (
                <tr key={s.session_id}>
                  <td>{AY_LABEL['2526']}</td>
                  <td className="d-muted">{s.itr_type || 'ITR-1'}</td>
                  <td><StatusPill status={s.status} /></td>
                  <td>
                    {taxAmt !== 0
                      ? <span style={{ color: isRefund ? '#0D7A5F' : '#DC2626', fontWeight: 600 }}>
                          {isRefund ? 'Refund ' : 'Pay '}{fmtINR(taxAmt)}
                        </span>
                      : '—'}
                  </td>
                  <td className="d-muted">{fmtDate(s.updated_at || s.created_at)}</td>
                  <td>
                    <button
                      className={'d-xml-btn' + (!canDownload ? ' d-xml-btn-disabled' : '')}
                      disabled={!canDownload}
                      onClick={() => canDownload && onDownload(s.session_id)}
                      title={!canDownload ? 'Available after payment and approval' : 'Download ITR XML'}
                    >⬇ XML</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = (() => { try { return JSON.parse(localStorage.getItem('taxly_user') || '{}') } catch { return {} } })()
  const phone = localStorage.getItem('taxly_user_phone')
  const userId = user.email || phone || 'demo@taxly.in'

  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [breakdown, setBreakdown] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [starting, setStarting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setFetchError(false)
    try {
      const res = await getSessions(userId)
      const all = (res.data || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      setSessions(all)
      const active = all.find(s => s.status !== 'complete' && s.status !== 'approved')
      if (active) {
        try {
          const full = await getSession(active.session_id)
          setCurrentSession(full.data || active)
          const inc = full.data?.income_data || active.income_data
          if (inc && Object.keys(inc).length > 0) {
            setBreakdown({ ...inc, itr_type: full.data?.itr_type || 'ITR-1' })
          }
        } catch { setCurrentSession(active) }
      }
    } catch { setFetchError(true) }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => {
    if (!localStorage.getItem('taxly_token')) { navigate('/login'); return }
    fetchData()
  }, [fetchData, navigate])

  // Dev mock: inject realistic data when API returns nothing
  useEffect(() => {
    if (sessions.length === 0 && !loading && !fetchError) {
      const mockSessions = [
        {
          session_id: 'mock-001', status: 'in_progress',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          messages: [
            { role: 'assistant', content: 'Hi! To get started, what is your employment type?' },
            { role: 'user', content: 'Salaried' },
            { role: 'assistant', content: 'What is your gross salary for the financial year 2024–25?' },
            { role: 'user', content: '8.5 lakh' },
          ],
          income_data: {
            gross_salary: 850000, standard_deduction: 50000, deduction_80c: 150000,
            hra_exemption: 0, net_taxable: 650000, tax_payable: 32500, tds_paid: 50000,
            refund: 17500, old_regime_tax: 46020, new_regime_tax: 32500, recommended_regime: 'new',
          },
        },
        {
          session_id: 'mock-002', status: 'complete', payment_status: 'paid',
          itr_type: 'ITR-1', tax_amount: -18420,
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          updated_at: new Date(Date.now() - 86400000 * 28).toISOString(),
        },
      ]
      setSessions(mockSessions)
      const active = mockSessions[0]
      setCurrentSession(active)
      const inc = active.income_data
      setBreakdown({ ...inc, itr_type: 'ITR-1' })
    }
  }, [sessions.length, loading, fetchError])

  async function startNewSession() {
    setStarting(true)
    try {
      const res = await createSession(userId)
      navigate('/chat/' + res.data.session_id)
    } catch { navigate('/chat/demo-session') }
  }

  async function handleDownloadXml(sessionId) {
    try {
      const res = await downloadXml(sessionId)
      const blob = new Blob([res.data], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'taxly_ITR_' + sessionId + '.xml'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('XML download failed. Please try again.') }
  }

  function handleLogout() {
    localStorage.removeItem('taxly_token')
    localStorage.removeItem('taxly_user')
    localStorage.removeItem('taxly_user_phone')
    navigate('/login')
  }

  const activeSession = currentSession || sessions.find(s => s.status !== 'complete' && s.status !== 'approved')
  const historySessions = sessions
    .filter(s => s.status === 'complete' || s.status === 'approved')
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  const isComplete = activeSession?.status === 'complete' || activeSession?.status === 'approved'
  const hasIncomeData = breakdown && breakdown.gross_salary > 0
  const showStats = activeSession && hasIncomeData
  const showBreakdown = isComplete && hasIncomeData

  return (
    <div className="d-root">
      <Navbar />
      <div className="d-content">
        {/* Welcome */}
        <div className="d-welcome">
          <div>
            <h1 className="d-welcome-title">Welcome back{user.name ? ', ' + user.name.split(' ')[0] : ''}! 👋</h1>
            <p className="d-welcome-sub">AY 2025–26 · Filing deadline: 31 July 2025</p>
          </div>
          <button className="d-logout" onClick={handleLogout}>Log out</button>
        </div>

        {/* Error banner */}
        {fetchError && <ErrorBanner onRetry={fetchData} />}

        {/* Stats row */}
        {loading
          ? <SkeletonCard height={104} />
          : showStats
          ? <StatsRow session={activeSession} breakdown={breakdown} />
          : null}

        {/* Current filing */}
        <div className="d-section-label" style={{ marginTop: showStats ? 28 : 0 }}>Current Filing</div>
        {loading
          ? <SkeletonCard height={148} />
          : activeSession
          ? <ActiveFilingCard session={activeSession} onContinue={() => navigate('/chat/' + activeSession.session_id)} />
          : <EmptyFilingCard onStart={startNewSession} starting={starting} />}

        {!loading && activeSession && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="d-new-btn" onClick={startNewSession} disabled={starting}>
              {starting ? '…' : '+ Start new filing'}
            </button>
          </div>
        )}

        {/* Tax breakdown + Regime comparison */}
        {!loading && showBreakdown && breakdown && (
          <>
            <TaxBreakdownCard breakdown={breakdown} />
            <RegimeComparisonCard breakdown={breakdown} />
          </>
        )}

        {/* History */}
        {!loading && <FilingHistorySection sessions={historySessions} onDownload={handleDownloadXml} />}
      </div>
      <style>{styles}</style>
    </div>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .d-root { min-height: 100vh; background: #F7F6F2; font-family: 'DM Sans', sans-serif; }
  .d-content { max-width: 880px; margin: 0 auto; padding: 36px 20px 100px; }

  /* Welcome */
  .d-welcome { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
  .d-welcome-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .d-welcome-sub { font-size: 14px; color: #64748b; }
  .d-logout { background: #fff; border: 1px solid #e2e8f0; color: #475569; padding: 9px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: border-color 0.15s; }
  .d-logout:hover { border-color: #cbd5e1; }

  /* Section label */
  .d-section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 12px; }

  /* Error banner */
  .d-error-banner { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; font-weight: 500; }
  .d-error-retry { background: #FEE2E2; border: 1px solid #FECACA; color: #B91C1C; padding: 6px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }

  /* Skeleton */
  .d-skeleton { border-radius: 20px; animation: d-shimmer 1.4s ease infinite; background-image: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 400% 100%; margin-bottom: 16px; }
  @keyframes d-shimmer { to { background-position: -200% 0; } }

  /* Generic card */
  .d-card { background: #fff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .d-card-title { font-size: 14px; font-weight: 700; color: #0f172a; padding: 20px 24px 0; margin-bottom: 12px; }

  /* Pill */
  .d-pill { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; display: inline-block; white-space: nowrap; }

  /* Stats row */
  .d-stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 0; }
  .d-stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .d-stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 8px; }
  .d-stat-value { font-size: 24px; font-weight: 800; line-height: 1; }
  .d-stat-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500; }

  /* Empty card */
  .d-empty-card { background: #fff; border-radius: 20px; padding: 48px 32px; text-align: center; border: 2px dashed #e2e8f0; }
  .d-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .d-empty-card h2 { font-size: 22px; color: #0f172a; font-weight: 800; margin-bottom: 8px; }
  .d-empty-card p { font-size: 15px; color: #64748b; margin-bottom: 24px; line-height: 1.6; max-width: 380px; margin-inline: auto; }
  .d-start-btn { background: linear-gradient(135deg, #0D7A5F, #0b6a50); color: #fff; border: none; padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(13,122,95,0.25); transition: opacity 0.15s; font-family: inherit; }
  .d-start-btn:hover { opacity: 0.9; }
  .d-start-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Active filing card */
  .d-active-card { background: linear-gradient(135deg, #0D7A5F 0%, #0b6a50 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(13,122,95,0.22); }
  .d-progress-track { height: 4px; background: rgba(255,255,255,0.18); width: 100%; }
  .d-progress-fill { height: 100%; background: #fff; transition: width 0.6s ease; border-radius: 0 2px 2px 0; }
  .d-active-body { padding: 24px 28px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .d-active-ay { display: flex; align-items: center; gap: 8px; font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 600; margin-bottom: 4px; }
  .d-active-step { font-size: 12px; color: rgba(255,255,255,0.55); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .d-active-preview { font-size: 14px; color: rgba(255,255,255,0.7); max-width: 400px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; line-height: 1.5; font-style: italic; margin: 0; }
  .d-active-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .d-continue-btn { background: #fff; color: #0D7A5F; border: none; padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: transform 0.12s, box-shadow 0.12s; font-family: inherit; }
  .d-continue-btn:hover { transform: scale(1.03); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

  /* New filing btn */
  .d-new-btn { background: transparent; border: 1.5px solid #0D7A5F; color: #0D7A5F; padding: 9px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
  .d-new-btn:hover { background: rgba(13,122,95,0.06); }

  /* Tax breakdown */
  .d-breakdown-list { padding: 0 24px 20px; }
  .d-breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
  .d-breakdown-row:last-child { border-bottom: none; }
  .d-breakdown-final { padding-top: 14px; margin-top: 4px; font-weight: 800; font-size: 16px; color: #0f172a; border-top: 2px solid #e2e8f0; }

  /* Regime comparison */
  .d-regime-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 24px; margin-bottom: 16px; }
  .d-regime-box { background: #F8FAFC; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; position: relative; transition: border-color 0.2s; }
  .d-regime-recommended { border-color: #0D7A5F; background: #F0FDF4; }
  .d-regime-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #0D7A5F; color: #fff; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 999px; white-space: nowrap; letter-spacing: 0.04em; text-transform: uppercase; }
  .d-regime-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
  .d-regime-tax { font-size: 22px; font-weight: 800; color: #0f172a; }
  .d-regime-hint { font-size: 13px; color: #64748b; padding: 0 24px 20px; margin: 0; }

  /* History table */
  .d-table-wrap { background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .d-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .d-table th { background: #F8FAFC; padding: 12px 18px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
  .d-table td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .d-table tr:last-child td { border-bottom: none; }
  .d-muted { color: #94a3b8 !important; }
  .d-xml-btn { background: #EFF6FF; color: #1D4ED8; border: none; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; }
  .d-xml-btn:hover:not(:disabled) { background: #DBEAFE; }
  .d-xml-btn-disabled { background: #F1F5F9 !important; color: #CBD5E1 !important; cursor: not-allowed !important; }

  /* Responsive */
  @media (max-width: 640px) {
    .d-stats-row { grid-template-columns: 1fr; }
    .d-active-body { flex-direction: column; align-items: flex-start; }
    .d-active-right { align-items: flex-start; width: 100%; }
    .d-continue-btn { width: 100%; text-align: center; }
    .d-regime-row { grid-template-columns: 1fr; }
    .d-table th:nth-child(2), .d-table td:nth-child(2) { display: none; }
  }
`
