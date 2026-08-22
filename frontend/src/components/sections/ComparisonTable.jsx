import { useReveal } from './hooks.jsx'
import './sections.css'

export default function ComparisonTable() {
  const [ref, vis] = useReveal()
  const rows = [
    { feature: 'Chat-based filing (no forms)', taxly: true, cleartax: false, ca: false },
    { feature: 'AI bank statement analysis', taxly: true, cleartax: false, ca: false },
    { feature: 'CA reviews every return', taxly: true, cleartax: false, ca: true },
    { feature: 'Auto-parses all TDS forms (16–16D)', taxly: true, cleartax: 'partial', ca: false },
    { feature: 'Old vs New regime comparison', taxly: true, cleartax: true, ca: true },
    { feature: 'Transparent flat pricing', taxly: true, cleartax: false, ca: false },
    { feature: 'Deduction suggestions with proof required', taxly: true, cleartax: false, ca: 'partial' },
    { feature: 'Filing in under 20 minutes', taxly: true, cleartax: false, ca: false },
  ]

  const cell = (v) => {
    if (v === true) return <span className="ct-yes">✓</span>
    if (v === 'partial') return <span className="ct-part">~</span>
    return <span className="ct-no">✗</span>
  }

  return (
    <section className={`sec comp-table ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: '#fff' }}>
      <div className="sec-inner">
        <h2>How Taxly compares</h2>
        <p className="sec-sub">The honest side-by-side.</p>
        <div className="ct-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                <th></th>
                <th className="ct-hl">Taxly</th>
                <th>ClearTax / Tax2Win</th>
                <th>Traditional CA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="ct-feat">{r.feature}</td>
                  <td className="ct-hl">{cell(r.taxly)}</td>
                  <td>{cell(r.cleartax)}</td>
                  <td>{cell(r.ca)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .ct-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ct-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 600px; }
        .ct-table th, .ct-table td { padding: 14px 16px; text-align: center; border-bottom: 1px solid var(--sec-paper-3); }
        .ct-table th { font-size: 14px; font-weight: 700; color: var(--sec-ink-2); text-transform: uppercase; letter-spacing: 0.05em; }
        .ct-table th.ct-hl, .ct-table td.ct-hl { background: rgba(27,79,216,0.04); }
        .ct-table th.ct-hl { color: var(--sec-blue); }
        .ct-feat { text-align: left !important; font-weight: 500; color: var(--sec-ink); }
        .ct-yes { color: var(--sec-green); font-weight: 700; font-size: 16px; }
        .ct-no { color: #ccc; font-size: 16px; }
        .ct-part { color: #e5a100; font-weight: 700; font-size: 16px; }
      `}</style>
    </section>
  )
}
