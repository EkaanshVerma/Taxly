import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession } from '../api/taxly'
import { approveClient, downloadXml } from '../api/ca'
import { useToast } from '../components/ToastContext'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function CAClientDetailPage({ caToken }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [notes, setNotes] = useState('')
  const [showApprovePanel, setShowApprovePanel] = useState(false)

  useEffect(() => {
    if (!caToken) { navigate('/ca/login'); return }
    getSession(sessionId)
      .then(r => setSession(r.data))
      .catch(() => toast.error('Failed to load client session'))
      .finally(() => setLoading(false))
  }, [sessionId, caToken, navigate, toast])

  async function handleApprove(e) {
    e.preventDefault()
    setApproving(true)
    try {
      await approveClient(caToken, sessionId, notes)
      toast.success('Return approved and client notified!')
      setShowApprovePanel(false)
      navigate('/ca/dashboard')
    } catch {
      toast.error('Approval failed — please try again.')
    } finally {
      setApproving(false)
    }
  }

  async function handleDownloadXml() {
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
      toast.error('XML download failed.')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif', color: '#64748b' }}>
      Loading client…
    </div>
  )

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'DM Sans, sans-serif', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>⚠</div>
      <p style={{ color: '#64748b' }}>Session not found</p>
      <button onClick={() => navigate('/ca/dashboard')} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
    </div>
  )

  const old = session.result?.old_regime || {}
  const rec = session.result?.recommended_regime

  return (
    <div className="cacd-root">
      {/* Header */}
      <div className="cacd-header">
        <button className="cacd-back" onClick={() => navigate('/ca/dashboard')}>← Dashboard</button>
        <div>
          <div className="cacd-header-name">{session.client_name || session.user_id || 'Client'}</div>
          <div className="cacd-header-sub">Session {sessionId.slice(0, 8)}… · AY 2025–26</div>
        </div>
        <div className="cacd-header-actions">
          {session.status === 'complete' && (
            <button className="cacd-xml-btn" onClick={handleDownloadXml}>⬇ ITR XML</button>
          )}
          {session.status !== 'approved' && (
            <button className="cacd-approve-btn" onClick={() => setShowApprovePanel(true)}>✓ Approve Return</button>
          )}
        </div>
      </div>

      <div className="cacd-body">
        {/* Status */}
        <div className="cacd-card">
          <div className="cacd-card-label">Session Status</div>
          <div className="cacd-status-row">
            <StatusBadge status={session.status} />
            <span className="cacd-updated">Last updated: {new Date(session.updated_at || Date.now()).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Chat transcript */}
        {session.messages && session.messages.length > 0 && (
          <div className="cacd-card">
            <div className="cacd-card-label">Conversation Transcript ({session.messages.length} messages)</div>
            <div className="cacd-transcript">
              {session.messages.map((m, i) => (
                <div key={i} className={`cacd-msg cacd-msg-${m.role === 'model' ? 'bot' : 'user'}`}>
                  <div className="cacd-msg-role">{m.role === 'model' ? '🤖 Taxly' : '👤 Client'}</div>
                  <div className="cacd-msg-text">{Array.isArray(m.parts) ? m.parts[0] : m.parts}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tax result */}
        {session.result && (
          <div className="cacd-card">
            <div className="cacd-card-label">Tax Computation</div>
            <div className="cacd-tax-grid">
              <TaxItem label="Gross Income" val={fmt((old.taxable_income || 0) + (old.total_deductions || 0))} />
              <TaxItem label="Total Deductions" val={fmt(old.total_deductions)} />
              <TaxItem label="Taxable Income" val={fmt(old.taxable_income)} big />
              <TaxItem label="Old Regime Tax" val={fmt(session.result.old_regime_total)} />
              <TaxItem label="New Regime Tax" val={fmt(session.result.new_regime_total)} />
              <TaxItem label="Recommended" val={rec === 'new' ? 'New Regime' : 'Old Regime'} badge />
              {session.result.savings_amount > 0 && (
                <TaxItem label="Potential Savings" val={fmt(session.result.savings_amount)} green />
              )}
            </div>
          </div>
        )}

        {/* CA notes */}
        {session.ca_notes && (
          <div className="cacd-card">
            <div className="cacd-card-label">CA Notes</div>
            <p className="cacd-notes-text">{session.ca_notes}</p>
          </div>
        )}
      </div>

      {/* Approval panel */}
      {showApprovePanel && (
        <div className="cacd-overlay" onClick={e => e.target === e.currentTarget && setShowApprovePanel(false)}>
          <div className="cacd-approve-modal">
            <h2>Approve Return</h2>
            <p>Once approved, the client will be notified to download their ITR XML.</p>
            <form onSubmit={handleApprove}>
              <label>Notes for client (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Verified Form 16 and deductions. Recommended new regime saves ₹12,400."
                rows={4}
              />
              <div className="cacd-modal-btns">
                <button type="button" onClick={() => setShowApprovePanel(false)}>Cancel</button>
                <button type="submit" className="cacd-confirm-approve" disabled={approving}>
                  {approving ? 'Approving…' : '✓ Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{cacdStyles}</style>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    complete: { bg: '#DCFCE7', text: '#166534', label: 'Complete' },
    in_progress: { bg: '#FEF9C3', text: '#854D0E', label: 'In Progress' },
    approved: { bg: '#DBEAFE', text: '#1e40af', label: 'Approved' },
    pending: { bg: '#F1F5F9', text: '#475569', label: 'Pending' },
  }
  const s = map[status] || map.pending
  return <span style={{ background: s.bg, color: s.text, fontWeight: 700, fontSize: 13, padding: '4px 14px', borderRadius: 999 }}>{s.label}</span>
}

function TaxItem({ label, val, big, badge, green }) {
  return (
    <div className="cacd-tax-item">
      <span className="cacd-tax-label">{label}</span>
      <span className={`cacd-tax-val${big ? ' big' : ''}${green ? ' green' : ''}${badge ? ' badge' : ''}`}>{val}</span>
    </div>
  )
}

const cacdStyles = `
  .cacd-root { min-height: 100vh; background: #F7F6F2; font-family: 'DM Sans', sans-serif; }
  .cacd-header {
    background: #1e293b;
    color: #fff;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .cacd-back {
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
    color: #fff; padding: 8px 16px; border-radius: 10px;
    font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap;
  }
  .cacd-header-name { font-size: 20px; font-weight: 700; }
  .cacd-header-sub { font-size: 13px; opacity: 0.65; }
  .cacd-header-actions { margin-left: auto; display: flex; gap: 10px; flex-wrap: wrap; }
  .cacd-xml-btn {
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    color: #fff; padding: 9px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer;
  }
  .cacd-approve-btn {
    background: #16a34a; border: none; color: #fff;
    padding: 9px 18px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
  }
  .cacd-body { max-width: 800px; margin: 0 auto; padding: 28px 20px 80px; display: flex; flex-direction: column; gap: 16px; }
  .cacd-card { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .cacd-card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; margin-bottom: 14px; }
  .cacd-status-row { display: flex; align-items: center; gap: 16px; }
  .cacd-updated { font-size: 13px; color: #94a3b8; }
  .cacd-transcript { max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
  .cacd-msg { padding: 12px 16px; border-radius: 12px; max-width: 90%; }
  .cacd-msg-bot { background: #F1F5F9; align-self: flex-start; }
  .cacd-msg-user { background: #DCFCE7; align-self: flex-end; }
  .cacd-msg-role { font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
  .cacd-msg-text { font-size: 14px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; }
  .cacd-tax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .cacd-tax-item { background: #F8FAFC; border-radius: 10px; padding: 14px 16px; }
  .cacd-tax-label { font-size: 12px; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px; }
  .cacd-tax-val { font-size: 16px; font-weight: 700; color: #0f172a; }
  .cacd-tax-val.big { font-size: 20px; color: #0D7A5F; }
  .cacd-tax-val.green { color: #16a34a; }
  .cacd-tax-val.badge { background: #DBEAFE; color: #1e40af; font-size: 13px; padding: 4px 12px; border-radius: 999px; }
  .cacd-notes-text { font-size: 14px; color: #475569; line-height: 1.7; white-space: pre-wrap; }
  .cacd-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 9000; padding: 20px; backdrop-filter: blur(4px);
  }
  .cacd-approve-modal {
    background: #fff; border-radius: 20px; padding: 32px;
    width: 100%; max-width: 480px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.15);
    animation: payIn 0.2s ease;
  }
  @keyframes payIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; } }
  .cacd-approve-modal h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
  .cacd-approve-modal p { font-size: 14px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
  .cacd-approve-modal label { font-size: 13px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
  .cacd-approve-modal textarea {
    width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; resize: vertical;
    outline: none; margin-bottom: 20px; box-sizing: border-box;
  }
  .cacd-approve-modal textarea:focus { border-color: #0D7A5F; }
  .cacd-modal-btns { display: flex; gap: 12px; }
  .cacd-modal-btns button {
    flex: 1; padding: 13px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: none;
  }
  .cacd-modal-btns button:first-child { background: #F1F5F9; color: #475569; }
  .cacd-confirm-approve { background: #16a34a !important; color: #fff !important; }
  .cacd-confirm-approve:disabled { opacity: 0.6; cursor: not-allowed !important; }
  @media (max-width: 600px) {
    .cacd-tax-grid { grid-template-columns: 1fr; }
    .cacd-header { flex-direction: column; align-items: flex-start; }
    .cacd-header-actions { margin-left: 0; }
  }
`
