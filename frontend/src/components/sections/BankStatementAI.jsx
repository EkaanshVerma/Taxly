import { useReveal } from './hooks.jsx'
import './sections.css'

export default function BankStatementAI() {
  const [ref, vis] = useReveal()
  const flags = [
    {
      amount: '₹45,000', freq: 'recurring credit', source: 'HDFC Bank',
      flag: 'Possible freelance income', confidence: 82,
      required: 'Invoice or contract', verified: true,
    },
    {
      amount: '₹18,000', freq: 'monthly debit', source: 'pattern matches rent',
      flag: 'Possible HRA claim', confidence: 91,
      required: 'Rent receipt + landlord PAN', verified: true,
    },
    {
      amount: '₹1,20,000', freq: 'credit', source: 'one-time',
      flag: 'Unclear source', confidence: 40,
      required: 'CA review needed', verified: false,
    },
  ]

  return (
    <section className={`sec bsa ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: 'var(--sec-paper)' }}>
      <div className="sec-inner">
        <h2>AI reviews your bank statement. A CA verifies it.</h2>
        <p className="sec-sub">Every unclear transaction gets flagged with a confidence score and the proof needed to claim it — never auto-claimed.</p>

        <div className="bsa-mock">
          <div className="bsa-header">
            <span className="bsa-dot" /><span className="bsa-dot" /><span className="bsa-dot" />
            <span className="bsa-title">Bank Statement Analysis</span>
          </div>
          {flags.map((f, i) => (
            <div className="bsa-row" key={i}>
              <div className="bsa-icon">{f.confidence >= 80 ? '📄' : '⚠️'}</div>
              <div className="bsa-main">
                <div className="bsa-txn">{f.amount} {f.freq} — <span className="bsa-src">{f.source}</span></div>
                <div className="bsa-meta">
                  <span className="sec-badge sec-badge-blue">{f.flag}</span>
                  <div className="bsa-conf">
                    <div className="bsa-bar"><div className="bsa-fill" style={{ width: `${f.confidence}%`, background: f.confidence >= 70 ? 'var(--sec-green)' : '#e5a100' }} /></div>
                    <span className="bsa-pct">{f.confidence}%</span>
                  </div>
                </div>
                <div className="bsa-req">Required: {f.required}</div>
              </div>
              <div className={`bsa-check ${f.verified ? 'done' : 'pending'}`}>
                {f.verified ? '✓ CA verified' : '⏳ Pending'}
              </div>
            </div>
          ))}
        </div>

        <p className="bsa-disclaimer">AI flags and suggests. It never files a deduction without your CA's sign-off.</p>
      </div>

      <style>{`
        .bsa-mock {
          max-width: 780px; margin: 0 auto; background: #fff; border: 1px solid var(--sec-paper-3);
          border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        }
        .bsa-header {
          display: flex; align-items: center; gap: 6px; padding: 14px 20px;
          background: var(--sec-paper); border-bottom: 1px solid var(--sec-paper-3);
        }
        .bsa-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sec-paper-3); }
        .bsa-title { margin-left: 12px; font-size: 13px; font-weight: 600; color: var(--sec-ink-2); }
        .bsa-row {
          display: flex; align-items: flex-start; gap: 16px; padding: 20px;
          border-bottom: 1px solid var(--sec-paper-3); transition: background 0.2s;
        }
        .bsa-row:last-child { border-bottom: none; }
        .bsa-row:hover { background: #FAFAF8; }
        .bsa-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
        .bsa-main { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .bsa-txn { font-size: 15px; font-weight: 600; color: var(--sec-ink); }
        .bsa-src { font-weight: 400; color: var(--sec-ink-2); }
        .bsa-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .bsa-conf { display: flex; align-items: center; gap: 6px; }
        .bsa-bar { width: 60px; height: 6px; background: var(--sec-paper-2); border-radius: 3px; overflow: hidden; }
        .bsa-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
        .bsa-pct { font-size: 12px; font-weight: 600; color: var(--sec-ink-2); font-family: var(--sec-mono); }
        .bsa-req { font-size: 13px; color: var(--sec-ink-3); }
        .bsa-check {
          font-size: 12px; font-weight: 600; white-space: nowrap; padding: 4px 10px;
          border-radius: 6px; flex-shrink: 0; margin-top: 4px;
        }
        .bsa-check.done { background: var(--sec-green-light); color: var(--sec-green); }
        .bsa-check.pending { background: #FFF8E6; color: #B8860B; }
        .bsa-disclaimer {
          text-align: center; font-size: 14px; color: var(--sec-ink-3); margin-top: 24px;
          font-style: italic;
        }
        @media (max-width: 640px) {
          .bsa-row { flex-direction: column; }
          .bsa-check { align-self: flex-start; }
        }
      `}</style>
    </section>
  )
}
