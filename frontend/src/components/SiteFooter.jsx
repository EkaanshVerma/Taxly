import React from 'react'
import { Link } from 'react-router-dom'

export default function SiteFooter({ theme }) {
  return (
    <footer>
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <Link to="/" aria-label="Taxly Home">
              <img
                src={theme === 'light' ? '/logo-color.png' : '/logo-white.png'}
                alt="Taxly Logo"
                className="footer-logo-img"
                onError={(e) => { e.target.src = '/logo.png' }}
              />
            </Link>
            <p>Conversational ITR filing for India, with a chartered accountant on every verdict that matters.</p>
          </div>
          <div className="f-col">
            <h5>Product</h5>
            <a href="/#how">How it works</a>
            <a href="/#analyze">Statement analysis</a>
            <Link to="/about#engine">Tax engine</Link>
            <a href="/#pricing">Pricing</a>
          </div>
          <div className="f-col">
            <h5>For CAs</h5>
            <Link to="/ca/login">CA portal</Link>
            <Link to="/for-cas/apply">Apply as a partner</Link>
            <Link to="/pricing">Practice pricing</Link>
          </div>
          <div className="f-col">
            <h5>Legal</h5>
            <Link to="/privacy-policy">Privacy policy</Link>
            <Link to="/terms-and-conditions">Terms of use</Link>
            <Link to="/refund-policy">Refund policy</Link>
            <Link to="/grievance">Grievance officer</Link>
          </div>
        </div>

        <p className="f-legal">
          Taxly prepares your return and generates the ITR XML. You submit and e-verify it on the income tax
          portal yourself. The self-file tier is automated tax preparation and does not constitute tax advice.
          Statement analysis surfaces items for a chartered accountant to verify — it is not a determination of
          taxability on its own.
        </p>

        <div className="f-base">
          <span>© 2026 TAXLY · MADE IN INDIA</span>
          <span>GRIEVANCE OFFICER · GRIEVANCE@TAXLY.IN · 15-DAY RESPONSE PER IT RULES 2021</span>
        </div>
      </div>
    </footer>
  )
}
