import { useReveal } from './hooks.jsx'
import './sections.css'

export default function DocumentIntelligence() {
  const [ref, vis] = useReveal()
  const forms = [
    { name: 'Form 16', aka: 'Form 130', covers: 'Salary TDS', desc: 'Employer-issued certificate for salary income and tax deducted.' },
    { name: 'Form 16A', aka: 'Form 131', covers: 'FD Interest & Dividends', desc: 'Bank-issued for non-salary income like fixed deposit interest.' },
    { name: 'Form 16B', aka: 'Form 132', covers: 'Property Sale TDS', desc: 'Issued by buyer for property transactions exceeding ₹50 lakhs.' },
    { name: 'Form 16C', aka: 'Form 132', covers: 'Rent TDS', desc: 'Issued by tenant for rent payments exceeding ₹50,000/month.' },
    { name: 'Form 16D', aka: 'Form 132', covers: 'Contractor TDS', desc: 'Issued for professional/contractor payments exceeding ₹50 lakhs.' },
  ]

  return (
    <section className={`sec doc-intel ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: '#fff' }}>
      <div className="sec-inner">
        <h2>One upload. Every document type, understood.</h2>
        <p className="sec-sub">Taxly auto-detects and parses Form 16, Form 16A, Form 16B, Form 16C, and Form 16D — no manual form selection.</p>
        <div className="di-grid">
          {forms.map((f, i) => (
            <div className="sec-card di-card" key={i}>
              <div className="di-head">
                <div>
                  <div className="di-name">{f.name}</div>
                  <div className="di-aka">{f.aka}</div>
                </div>
                <span className="sec-badge sec-badge-green">Auto-detected</span>
              </div>
              <div className="di-covers">{f.covers}</div>
              <p className="di-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .di-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .di-card { display: flex; flex-direction: column; gap: 12px; }
        .di-head { display: flex; justify-content: space-between; align-items: flex-start; }
        .di-name { font-size: 20px; font-weight: 700; color: var(--sec-ink); font-family: var(--sec-sans); }
        .di-aka { font-size: 12px; color: var(--sec-ink-3); font-family: var(--sec-mono); margin-top: 2px; }
        .di-covers { font-size: 14px; font-weight: 600; color: var(--sec-blue); text-transform: uppercase; letter-spacing: 0.05em; }
        .di-desc { font-size: 14px; color: var(--sec-ink-2); line-height: 1.6; margin: 0; }
      `}</style>
    </section>
  )
}
