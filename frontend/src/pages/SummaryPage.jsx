import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { calculateTax } from '../api/taxly'
import RegimeComparison from '../components/RegimeComparison'
import PaymentModal from '../components/PaymentModal'
import { useToast } from '../components/ToastContext'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function SummaryPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [xmlBlob, setXmlBlob] = useState(null)
  const [xmlLoading, setXmlLoading] = useState(false)

  useEffect(() => {
    calculateTax(sessionId)
      .then(res => setResult(res.data))
      .catch(() => setError(true))
  }, [sessionId])

  function handlePaymentSuccess(blob) {
    setXmlBlob(blob)
    setShowPayModal(false)
    toast.success('Payment successful! Your ITR XML is ready to download.')
  }

  function downloadXml() {
    if (!xmlBlob) return
    const url = URL.createObjectURL(xmlBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `taxly_ITR_AY2526_${sessionId}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (error) return (
    <div className="sum-root">
      <div className="sum-error">
        <div className="sum-error-icon">⚠</div>
        <h2>Couldn't calculate your tax</h2>
        <p>There may be an issue with the backend server or your session data. Please go back and check your answers.</p>
        <button className="sum-back-btn" onClick={() => navigate(`/chat/${sessionId}`)}>← Back to chat</button>
        <button className="sum-dash-btn" onClick={() => navigate('/dashboard')}>Go to dashboard</button>
      </div>
      <style>{summaryStyles}</style>
    </div>
  )

  if (!result) return (
    <div className="sum-root">
      <div className="sum-loading">
        <div className="sum-loading-spinner" />
        <p>Crunching your numbers…</p>
      </div>
      <style>{summaryStyles}</style>
    </div>
  )

  const old = result.old_regime
  const nw = result.new_regime
  const rec = result.recommended_regime
  const grossIncome = (old.taxable_income || 0) + (old.total_deductions || 0)

  return (
    <div className="sum-root">
      {showPayModal && (
        <PaymentModal
          sessionId={sessionId}
          amount={499}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayModal(false)}
        />
      )}

      {/* Header */}
      <div className="sum-header">
        <button className="sum-header-back" onClick={() => navigate(`/chat/${sessionId}`)}>←</button>
        <div>
          <div className="sum-header-title">Your Tax Summary</div>
          <div className="sum-header-sub">AY 2025–26 · Based on information you provided</div>
        </div>
        <button className="sum-header-dash" onClick={() => navigate('/dashboard')}>Dashboard</button>
      </div>

      <div className="sum-body">
        {/* Recommendation pill */}
        <div className="sum-rec-pill">
          <span className="sum-rec-badge">{rec === 'new' ? 'New Regime' : 'Old Regime'} Recommended</span>
          {result.savings_amount > 0 && (
            <span className="sum-rec-savings">Save {fmt(result.savings_amount)} by switching</span>
          )}
        </div>

        {/* Income breakdown */}
        <div className="sum-card">
          <div className="sum-card-label">Income Breakdown</div>
          <SumRow label="Gross Total Income" val={fmt(grossIncome)} />
          <SumRow label="Total Deductions (80C/80D…)" val={fmt(old.total_deductions)} muted />
          <SumRow label="Taxable Income" val={fmt(old.taxable_income)} big />
        </div>

        {/* Regime comparison */}
        <div className="sum-card">
          <div className="sum-card-label">Regime Comparison</div>
          <RegimeComparison
            oldTax={result.old_regime_total}
            newTax={result.new_regime_total}
            recommended={rec}
            savings={result.savings_amount}
            explanation={result.savings_explanation}
          />
        </div>

        {/* Deductions */}
        {old.deduction_breakdown && Object.values(old.deduction_breakdown).some(v => v > 0) && (
          <div className="sum-card">
            <div className="sum-card-label">Deductions Applied</div>
            {Object.entries(old.deduction_breakdown).map(([k, v]) => v > 0 && (
              <SumRow key={k} label={k.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())} val={fmt(v)} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="sum-cta-area">
          {xmlBlob ? (
            <button className="sum-pay-btn sum-dl-btn" onClick={downloadXml}>
              ⬇ Download ITR XML
            </button>
          ) : (
            <button className="sum-pay-btn" onClick={() => setShowPayModal(true)}>
              Pay ₹499 &amp; Download ITR XML
            </button>
          )}
          <button className="sum-review-btn" onClick={() => navigate(`/chat/${sessionId}`)}>
            Review my answers
          </button>
        </div>

        <p className="sum-disclaimer">
          Taxly generates your return based on information you provide. You are responsible for its accuracy.
          This is not a substitute for professional tax advice.
        </p>
      </div>
      <style>{summaryStyles}</style>
    </div>
  )
}

function SumRow({ label, val, big, muted }) {
  return (
    <div className="sum-row">
      <span className={`sum-row-label${muted ? ' muted' : ''}`}>{label}</span>
      <span className={`sum-row-val${big ? ' big' : ''}`}>{val}</span>
    </div>
  )
}

const summaryStyles = `
  .sum-root {
    min-height: 100vh;
    background: #F7F6F2;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
  }
  .sum-header {
    background: linear-gradient(135deg, #0D7A5F 0%, #0b6a50 100%);
    color: #fff;
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .sum-header-back {
    background: rgba(255,255,255,0.15);
    border: none;
    color: #fff;
    width: 40px; height: 40px;
    border-radius: 10px;
    font-size: 20px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .sum-header-title { font-size: 22px; font-weight: 700; }
  .sum-header-sub { font-size: 13px; opacity: 0.75; }
  .sum-header-dash {
    margin-left: auto;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.3);
    color: #fff;
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .sum-body {
    flex: 1;
    max-width: 720px;
    width: 100%;
    margin: 0 auto;
    padding: 28px 20px 60px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .sum-rec-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sum-rec-badge {
    background: #DCFCE7;
    color: #166534;
    font-weight: 700;
    font-size: 13.5px;
    padding: 6px 16px;
    border-radius: 999px;
    border: 1px solid #86EFAC;
  }
  .sum-rec-savings {
    font-size: 13.5px;
    color: #15803D;
    font-weight: 600;
  }
  .sum-card {
    background: #fff;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .sum-card-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #94a3b8;
    margin-bottom: 16px;
  }
  .sum-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .sum-row:last-child { border-bottom: none; }
  .sum-row-label { font-size: 14.5px; color: #1e293b; }
  .sum-row-label.muted { color: #64748b; }
  .sum-row-val { font-size: 14.5px; font-weight: 600; color: #0f172a; }
  .sum-row-val.big { font-size: 18px; font-weight: 800; color: #0D7A5F; }
  .sum-cta-area {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }
  .sum-pay-btn {
    background: linear-gradient(135deg, #0D7A5F, #0b6a50);
    color: #fff;
    border: none;
    padding: 18px;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    transition: opacity 0.15s;
    box-shadow: 0 4px 20px rgba(13,122,95,0.25);
  }
  .sum-pay-btn:hover { opacity: 0.92; }
  .sum-dl-btn { background: linear-gradient(135deg, #1d4ed8, #1e40af); }
  .sum-review-btn {
    background: transparent;
    color: #0D7A5F;
    border: 2px solid #0D7A5F;
    padding: 14px;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
  }
  .sum-disclaimer {
    font-size: 12px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.6;
    margin-top: 8px;
  }
  .sum-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; gap: 20px; padding-top: 100px;
  }
  .sum-loading-spinner {
    width: 40px; height: 40px;
    border: 4px solid #e2e8f0;
    border-top-color: #0D7A5F;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .sum-loading p { font-size: 16px; color: #64748b; font-weight: 500; }
  .sum-error {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; gap: 16px; padding: 60px 20px; text-align: center;
  }
  .sum-error-icon { font-size: 48px; }
  .sum-error h2 { font-size: 22px; color: #1e293b; }
  .sum-error p { font-size: 15px; color: #64748b; max-width: 420px; line-height: 1.6; }
  .sum-back-btn, .sum-dash-btn {
    padding: 12px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; border: none;
  }
  .sum-back-btn { background: #0D7A5F; color: #fff; }
  .sum-dash-btn { background: #f1f5f9; color: #1e293b; }
`
