import { Link } from 'react-router-dom'
import './sections.css'

export default function SecurityStrip() {
  return (
    <div className="security-strip">
      <span className="ss-icon">🔒</span>
      <span className="ss-text">
        Your data is never sold. Bank statements are parsed and discarded, never stored raw.{' '}
        <Link to="/security" className="ss-link">Grievance officer contact and full data policy →</Link>
      </span>

      <style>{`
        .security-strip {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 16px 24px; background: var(--sec-paper-2, #EFEEE9);
          font-size: 13.5px; color: var(--sec-ink-2); text-align: center; flex-wrap: wrap;
        }
        .ss-icon { font-size: 16px; }
        .ss-link { color: var(--sec-blue); text-decoration: none; font-weight: 600; }
        .ss-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
