import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'

export default function LandingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function startFiling() {
    setLoading(true)
    try {
      const userId = uuidv4()
      const res = await createSession(userId)
      navigate(`/chat/${res.data.session_id}`)
    } catch {
      setLoading(false)
      alert("Couldn't connect. Is the backend running?")
    }
  }

  return (
    <div className="view active" id="landing">
      <div className="land-grain"></div>
      <div className="land-blob land-blob-1"></div>
      <div className="land-blob land-blob-2"></div>
      <div className="land-inner">
        <div className="land-badge">
          <div className="land-badge-dot"></div>
          Filing season open · AY 2025–26
        </div>
        <h1 className="land-h">File your taxes<br/>in <em>plain English.</em></h1>
        <p className="land-sub">Answer a few questions like you'd explain it to a friend. No CA, no jargon, no confusion.</p>
        <button className="land-cta" onClick={startFiling}>
          {loading ? "Starting…" : "Start Filing"}
          {!loading && <span className="land-cta-arrow">→</span>}
        </button>
        <p className="land-note">₹499 one-time · No account needed · 20 minutes</p>
        <div className="land-trust">
          <div className="trust-card">
            <div className="trust-card-num">80M</div>
            <div className="trust-card-label">ITR filers in India</div>
          </div>
          <div className="trust-card">
            <div className="trust-card-num">₹499</div>
            <div className="trust-card-label">vs ₹2,000–5,000 CA fee</div>
          </div>
          <div className="trust-card">
            <div className="trust-card-num">86%</div>
            <div className="trust-card-label">gross margin vs CA</div>
          </div>
        </div>
        <div className="land-compare">
          <div className="compare-row">
            <span className="compare-label">CA firm</span>
            <span className="compare-val bad">₹2,000–15,000 · 3–7 days</span>
          </div>
          <div className="compare-row">
            <span className="compare-label">ClearTax / TaxBuddy</span>
            <span className="compare-val bad">Forms, jargon, confusion</span>
          </div>
          <div className="compare-row">
            <span className="compare-label">Taxly</span>
            <span className="compare-val good">₹499 · 20 min · plain English</span>
          </div>
        </div>
      </div>
    </div>
  )
}
