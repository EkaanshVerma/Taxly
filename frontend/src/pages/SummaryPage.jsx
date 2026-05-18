import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { calculateTax, generateXml } from '../api/taxly'
import RegimeComparison from '../components/RegimeComparison'

export default function SummaryPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(false)
  const [xmlLoading, setXmlLoading] = useState(false)

  useEffect(() => {
    calculateTax(sessionId)
      .then(res => setResult(res.data))
      .catch(() => setError(true))
  }, [sessionId])

  async function handlePay() {
    // Razorpay integration goes here in Mission 5
    alert('Razorpay payment coming in Mission 5!')
  }

  if (error) return (
    <div className="view active" id="summary">
      <div className="summary-body" style={{paddingTop:60, textAlign:'center'}}>
        <p style={{color:'var(--ink-2)', marginBottom:20}}>
          Couldn't calculate your tax. Please go back and check your answers.
        </p>
        <button className="sec-btn" onClick={() => navigate(`/chat/${sessionId}`)}>
          ← Go back
        </button>
      </div>
    </div>
  )

  if (!result) return (
    <div className="view active" id="summary">
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh'}}>
        <div className="typing-bubble">
          <div className="typing-dots"><span/><span/><span/></div>
        </div>
      </div>
    </div>
  )

  const old = result.old_regime
  const nw = result.new_regime
  const rec = result.recommended_regime

  return (
    <div className="view active" id="summary">
      <div className="summary-header">
        <button className="summary-back" onClick={() => navigate(`/chat/${sessionId}`)}>←</button>
        <div className="summary-title-wrap">
          <div className="summary-title">Your tax summary</div>
          <div className="summary-sub">AY 2025–26 · Based on info you provided</div>
        </div>
      </div>
      <div className="summary-body">
        <div className="sum-card">
          <div className="sum-section-label">Income breakdown</div>
          <div className="sum-row">
            <span className="sum-row-label">Total income</span>
            <span className="sum-row-val">₹{(old.taxable_income + old.total_deductions).toLocaleString('en-IN')}</span>
          </div>
          <div className="sum-row">
            <span className="sum-row-label">Total deductions</span>
            <span className="sum-row-val">₹{old.total_deductions.toLocaleString('en-IN')}</span>
          </div>
          <div className="sum-row">
            <span className="sum-row-label">Taxable income</span>
            <span className="sum-row-val big">₹{old.taxable_income.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="sum-card">
          <div className="sum-section-label">Regime comparison</div>
          <RegimeComparison
            oldTax={result.old_regime_total}
            newTax={result.new_regime_total}
            recommended={rec}
            savings={result.savings_amount}
            explanation={result.savings_explanation}
          />
        </div>

        <div className="sum-card">
          <div className="sum-section-label">Deductions applied</div>
          {Object.entries(old.deduction_breakdown).map(([k, v]) => v > 0 && (
            <div className="sum-row" key={k}>
              <span className="sum-row-label">{k.replace(/_/g,' ')}</span>
              <span className="sum-row-val">₹{v.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <button className="pay-btn" onClick={handlePay}>
          Pay ₹499 & Download ITR XML
        </button>
        <button className="sec-btn" onClick={() => navigate(`/chat/${sessionId}`)}>
          Review my answers
        </button>
        <p className="disclaimer">
          Taxly generates your return based on information you provide.
          You are responsible for accuracy. Not a substitute for professional tax advice.
        </p>
      </div>
    </div>
  )
}
