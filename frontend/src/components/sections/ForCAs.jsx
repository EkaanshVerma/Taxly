import { Link } from 'react-router-dom'
import { useReveal } from './hooks.jsx'
import './sections.css'

export default function ForCAs() {
  const [ref, vis] = useReveal()
  const features = [
    { icon: '🤖', title: 'AI-powered document parsing', desc: 'Form 16, 16A–16D parsed automatically. You never key in numbers.' },
    { icon: '📋', title: 'Structured flag queue', desc: 'Review AI-flagged transactions with confidence scores and required documents, not a raw bank statement.' },
    { icon: '⚡', title: 'Regime engine built in', desc: '134 automated tests, Old vs New comparison done before it reaches you.' },
    { icon: '💬', title: 'Client chat history', desc: 'See the full conversation between the client and Taxly AI — no back-and-forth calls.' },
    { icon: '🔒', title: 'Secure dashboard', desc: 'All client data encrypted, SOC-2 aligned practices, your own login.' },
    { icon: '💰', title: 'Transparent revenue share', desc: 'Per-filing fee, paid weekly. No lock-ins, no minimum commitments.' },
  ]

  return (
    <section className={`sec for-cas ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: '#fff' }}>
      <div className="sec-inner">
        <h2>AI flags. You verify. That's the job.</h2>
        <p className="sec-sub">
          Taxly's AI does the mechanical work — parsing documents, flagging unclear transactions, suggesting deductions with required proof.
          Your time goes entirely into verification and judgment, not data entry.
        </p>
        <div className="ca-grid">
          {features.map((f, i) => (
            <div className="sec-card ca-card" key={i}>
              <div className="ca-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/for-cas/apply" className="sec-cta sec-cta-green">Apply as a CA partner →</Link>
        </div>
      </div>

      <style>{`
        .ca-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .ca-card h3 { font-size: 17px; font-weight: 700; color: var(--sec-ink); margin: 12px 0 6px; }
        .ca-card p { font-size: 14px; color: var(--sec-ink-2); line-height: 1.6; margin: 0; }
        .ca-icon { font-size: 28px; }
      `}</style>
    </section>
  )
}
