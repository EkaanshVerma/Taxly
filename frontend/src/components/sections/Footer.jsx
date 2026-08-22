import { Link } from 'react-router-dom'
import './sections.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="sf-container">
        <div className="sf-grid">
          <div className="sf-col sf-brand">
            <img src="/logo-white.png" alt="Taxly Logo" className="sf-logo" />
            <p>India's plain-English A.I. and CA tax filing service.</p>
          </div>

          <div className="sf-col">
            <h4>Product</h4>
            <ul>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/features/bank-statement-review">How Taxly Works</Link></li>
              <li><Link to="/for-cas">For CAs</Link></li>
              <li><Link to="/guides/old-vs-new">Old vs New Regime Guide</Link></li>
            </ul>
          </div>

          <div className="sf-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions">Terms &amp; Conditions</Link></li>
              <li><Link to="/refund-policy">Refund Policy</Link></li>
              <li><Link to="/grievance">Grievance Officer</Link></li>
              <li><Link to="/security">Security</Link></li>
            </ul>
          </div>

          <div className="sf-col">
            <h4>Support</h4>
            <ul>
              <li><a href="mailto:support@taxly.in">support@taxly.in</a></li>
              <li><a href="mailto:grievance@taxly.in">grievance@taxly.in</a></li>
            </ul>
          </div>
        </div>

        <div className="sf-bottom">
          <span>© {new Date().getFullYear()} Taxly. All rights reserved.</span>
          <span className="sf-grievance">
            Grievance Officer: Ekaansh Verma · <a href="mailto:grievance@taxly.in">grievance@taxly.in</a> · Response within 15 days as per IT Rules, 2021.
          </span>
        </div>
      </div>

      <style>{`
        .site-footer { background: #0B1A33; color: #fff; padding: 80px 24px 40px; }
        .sf-container { max-width: 1140px; margin: 0 auto; }
        .sf-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .sf-logo { height: 56px; margin-bottom: 16px; }
        .sf-brand p { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
        .sf-col h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; color: rgba(255,255,255,0.9); }
        .sf-col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .sf-col ul a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .sf-col ul a:hover { color: #fff; }
        .sf-bottom {
          border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px;
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
          font-size: 13px; color: rgba(255,255,255,0.4);
        }
        .sf-grievance a { color: #8CE6B8; text-decoration: none; }
        .sf-grievance a:hover { text-decoration: underline; }
        @media (max-width: 768px) {
          .sf-grid { grid-template-columns: 1fr; gap: 32px; }
          .sf-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  )
}
