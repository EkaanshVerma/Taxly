import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { createSession } from '../api/taxly'
import './StaticPageLayout.css'

export default function StaticPageLayout({ children, title }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  async function startFiling(e) {
    if (e) e.preventDefault()
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
    <div className="static-layout view active">
      <nav className="static-nav">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Taxly Logo" style={{ height: '48px' }} />
        </Link>
        <ul className="nav-links">
          <li><a href="#" onClick={startFiling}>File Taxes</a></li>
          <li><Link to="/pricing">Pricing</Link></li>
          <li><Link to="/features/bank-statement-review">How it Works</Link></li>
          <li><Link to="/for-cas">For CAs</Link></li>
        </ul>
        <a href="#" onClick={startFiling} className="btn-nav">
          {loading ? "Starting..." : "Get started — it's free"}
        </a>
      </nav>

      <main className="static-content">
        {title && <div className="static-header-banner"><h1 className="static-title">{title}</h1></div>}
        <div className="static-body">
          {children}
        </div>
      </main>

      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-col">
            <Link to="/">
              <img src="/logo-white.png" alt="Taxly Logo" className="footer-logo" />
            </Link>
            <p>India's plain English A.I. and CA tax filing service.</p>
          </div>
          <div className="footer-col">
            <h4>Legal &amp; Compliance</h4>
            <ul>
              <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/security">Security</Link></li>
              <li><Link to="/grievance">Data Deletion / Grievance</Link></li>
            </ul>
          </div>
          <div className="footer-col compliance-col">
            <h4>Grievance Officer (IT Rules, 2021)</h4>
            <p><strong>Name:</strong> Ekaansh Verma</p>
            <p><strong>Title:</strong> Grievance Officer, Taxly</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@taxly.in">grievance@taxly.in</a></p>
            <p className="response-time">We acknowledge grievances within 24 hours and resolve them within 15 days, as per the IT Rules, 2021.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
