import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSessions, createSession, downloadXml } from '../api/taxly'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'

const AY_LABEL = { '2526': 'AY 2025–26', '2425': 'AY 2024–25' }

const STATUS_COLOR = {
  complete: { bg: '#DCFCE7', text: '#166534', label: 'Filed' },
  in_progress: { bg: '#FEF9C3', text: '#854D0E', label: 'In Progress' },
  pending: { bg: '#F1F5F9', text: '#475569', label: 'Pending' },
}

export default function UserDashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('taxly_user') || '{}')
  const userId = user.email || 'demo@taxly.in'
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('taxly_token')) {
      navigate('/login')
      return
    }
    getSessions(userId)
      .then(res => setSessions(res.data || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [userId, navigate])

  async function startNewSession() {
    setStarting(true)
    try {
      const res = await createSession(userId)
      navigate(`/chat/${res.data.session_id}`)
    } catch {
      toast.error('Could not start a new session. Please try again.')
      setStarting(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('taxly_token')
    localStorage.removeItem('taxly_user')
    navigate('/login')
  }

  async function handleDownloadXml(sessionId) {
    try {
      const res = await downloadXml(sessionId)
      const blob = new Blob([res.data], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taxly_ITR_${sessionId}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('XML download failed. Please try again or contact support.')
    }
  }

  const completedSessions = sessions.filter(s => s.status === 'complete')
  const pendingSessions = sessions.filter(s => s.status !== 'complete')
  const currentSession = pendingSessions[0]

  return (
    <div className="dash-root">
      <Navbar />

      <div className="dash-content">
        {/* Welcome */}
        <div className="dash-welcome">
          <div>
            <h1 className="dash-welcome-title">
              Welcome back{user.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="dash-welcome-sub">AY 2025–26 filing deadline: 31 July 2025</p>
          </div>
          <button className="dash-logout" onClick={handleLogout}>Log out</button>
        </div>

        {/* Current filing card */}
        <div className="dash-section-label">Current Filing</div>
        {loading ? (
          <div className="dash-skeleton" />
        ) : currentSession ? (
          <div className="dash-current-card">
            <div className="dash-current-left">
              <div className="dash-current-ay">{AY_LABEL['2526']}</div>
              <div className="dash-current-status">
                <span className="dash-status-pill" style={{
                  background: STATUS_COLOR[currentSession.status]?.bg,
                  color: STATUS_COLOR[currentSession.status]?.text
                }}>
                  {STATUS_COLOR[currentSession.status]?.label || currentSession.status}
                </span>
              </div>
              <p className="dash-current-info">
                Last updated {new Date(currentSession.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              className="dash-continue-btn"
              onClick={() => navigate(`/chat/${currentSession.session_id}`)}
            >
              Continue filing →
            </button>
          </div>
        ) : (
          <div className="dash-empty-card">
            <div className="dash-empty-icon">📋</div>
            <h2>Start your first filing</h2>
            <p>Taxly will guide you through a quick 20-minute conversation — no forms, no jargon.</p>
            <button className="dash-start-btn" onClick={startNewSession} disabled={starting}>
              {starting ? 'Starting…' : 'Start ITR Filing'}
            </button>
          </div>
        )}

        {currentSession && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="dash-new-btn" onClick={startNewSession} disabled={starting}>
              {starting ? '…' : '+ Start new filing'}
            </button>
          </div>
        )}

        {/* Filing history */}
        {completedSessions.length > 0 && (
          <>
            <div className="dash-section-label" style={{ marginTop: 32 }}>Filing History</div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Assessment Year</th>
                    <th>Status</th>
                    <th>Tax Payable / Refund</th>
                    <th>Filed On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {completedSessions.map(s => (
                    <tr key={s.session_id}>
                      <td>{AY_LABEL['2526'] || 'AY 2025–26'}</td>
                      <td>
                        <span className="dash-status-pill" style={{
                          background: STATUS_COLOR.complete.bg,
                          color: STATUS_COLOR.complete.text
                        }}>
                          Filed
                        </span>
                      </td>
                      <td className="dash-amount">
                        {s.tax_amount > 0
                          ? <span className="dash-payable">Pay ₹{s.tax_amount?.toLocaleString('en-IN')}</span>
                          : <span className="dash-refund">Refund ₹{Math.abs(s.tax_amount || 0).toLocaleString('en-IN')}</span>
                        }
                      </td>
                      <td>{new Date(s.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>
                        <button
                          className="dash-xml-btn"
                          onClick={() => handleDownloadXml(s.session_id)}
                        >
                          ⬇ XML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Empty state if no sessions at all */}
        {!loading && sessions.length === 0 && (
          <></>
        )}
      </div>

      <style>{dashStyles}</style>
    </div>
  )
}

const dashStyles = `
  .dash-root {
    min-height: 100vh;
    background: #F7F6F2;
    font-family: 'DM Sans', sans-serif;
  }
  .dash-content {
    max-width: 860px;
    margin: 0 auto;
    padding: 36px 20px 80px;
  }
  .dash-welcome {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .dash-welcome-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 4px;
  }
  .dash-welcome-sub { font-size: 14px; color: #64748b; }
  .dash-logout {
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 9px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .dash-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 12px;
  }
  .dash-skeleton {
    height: 140px;
    background: #e2e8f0;
    border-radius: 20px;
    animation: shimmer 1.4s ease infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  .dash-current-card {
    background: linear-gradient(135deg, #0D7A5F 0%, #0b6a50 100%);
    border-radius: 20px;
    padding: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    box-shadow: 0 8px 30px rgba(13,122,95,0.2);
  }
  .dash-current-ay { font-size: 15px; color: rgba(255,255,255,0.75); margin-bottom: 6px; font-weight: 600; }
  .dash-current-status { margin-bottom: 6px; }
  .dash-current-info { font-size: 13px; color: rgba(255,255,255,0.6); }
  .dash-status-pill {
    font-size: 12.5px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 999px;
    display: inline-block;
  }
  .dash-continue-btn {
    background: #fff;
    color: #0D7A5F;
    border: none;
    padding: 14px 28px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: transform 0.12s;
  }
  .dash-continue-btn:hover { transform: scale(1.03); }

  .dash-empty-card {
    background: #fff;
    border-radius: 20px;
    padding: 48px 32px;
    text-align: center;
    border: 2px dashed #e2e8f0;
  }
  .dash-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .dash-empty-card h2 { font-size: 22px; color: #0f172a; font-weight: 800; margin-bottom: 8px; }
  .dash-empty-card p { font-size: 15px; color: #64748b; margin-bottom: 24px; line-height: 1.6; max-width: 380px; margin-inline: auto; }
  .dash-start-btn {
    background: linear-gradient(135deg, #0D7A5F, #0b6a50);
    color: #fff; border: none;
    padding: 16px 36px; border-radius: 14px;
    font-size: 16px; font-weight: 700; cursor: pointer;
    box-shadow: 0 4px 20px rgba(13,122,95,0.25);
    transition: opacity 0.15s;
  }
  .dash-start-btn:hover { opacity: 0.9; }
  .dash-start-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .dash-new-btn {
    background: transparent;
    border: 1.5px solid #0D7A5F;
    color: #0D7A5F;
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .dash-table-wrap {
    background: #fff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .dash-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .dash-table th {
    background: #F8FAFC;
    padding: 12px 18px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    border-bottom: 1px solid #E2E8F0;
  }
  .dash-table td {
    padding: 14px 18px;
    border-bottom: 1px solid #F1F5F9;
    color: #334155;
  }
  .dash-table tr:last-child td { border-bottom: none; }
  .dash-payable { color: #DC2626; font-weight: 600; }
  .dash-refund { color: #16a34a; font-weight: 600; }
  .dash-xml-btn {
    background: #EFF6FF;
    color: #1D4ED8;
    border: none;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .dash-xml-btn:hover { background: #DBEAFE; }
`
