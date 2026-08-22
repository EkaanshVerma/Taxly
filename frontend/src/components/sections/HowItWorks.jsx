import { useReveal } from './hooks.jsx'
import './sections.css'

export default function HowItWorks() {
  const [ref, vis] = useReveal()
  const steps = [
    {
      num: '01', title: 'Chat with Taxly AI',
      desc: 'Answer simple questions in plain English. Upload your Form 16 or any TDS certificate — we parse it instantly.',
      icon: (
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/><path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
      ),
    },
    {
      num: '02', title: 'AI compares regimes',
      desc: 'Our engine runs 134 tax tests, compares Old vs New regime, and finds the one that saves you the most.',
      icon: (
        <svg viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M6 18h36M18 18v20" stroke="currentColor" strokeWidth="2"/><circle cx="32" cy="28" r="3" fill="currentColor"/></svg>
      ),
    },
    {
      num: '03', title: 'CA reviews & you file',
      desc: 'A real Chartered Accountant reviews your return, approves it, and you download the XML to upload on the IT portal.',
      icon: (
        <svg viewBox="0 0 48 48" fill="none"><path d="M14 24l6 6 14-14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2"/></svg>
      ),
    },
  ]

  return (
    <section className={`sec how-it-works ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: 'var(--sec-paper)' }}>
      <div className="sec-inner">
        <h2>File in 3 simple steps</h2>
        <p className="sec-sub">No CA office visits. No complex forms. Just a conversation.</p>
        <div className="hiw-grid">
          {steps.map((s, i) => (
            <div className="hiw-step" key={i}>
              <div className="hiw-icon">{s.icon}</div>
              <div className="hiw-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hiw-arrow">
                  <svg viewBox="0 0 40 12"><path d="M0 6h32l-4-4M32 6l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hiw-grid { display: flex; align-items: flex-start; justify-content: center; gap: 16px; }
        .hiw-step {
          flex: 1; max-width: 320px; text-align: center; padding: 32px 20px; position: relative;
          border-radius: 20px; transition: transform 0.3s, box-shadow 0.3s;
        }
        .hiw-step:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.06); }
        .hiw-icon {
          width: 72px; height: 72px; margin: 0 auto 16px;
          background: linear-gradient(135deg, rgba(13,122,95,0.12), rgba(34,163,152,0.08));
          border-radius: 20px; display: flex; align-items: center; justify-content: center;
          color: var(--sec-green); transition: transform 0.3s;
        }
        .hiw-step:hover .hiw-icon { transform: scale(1.08) rotate(-3deg); }
        .hiw-icon svg { width: 36px; height: 36px; }
        .hiw-num { font-family: var(--sec-mono); font-size: 13px; font-weight: 600; color: var(--sec-green); margin-bottom: 8px; letter-spacing: 0.1em; }
        .hiw-step h3 { font-size: 20px; font-weight: 700; color: var(--sec-ink); margin-bottom: 10px; }
        .hiw-step p { font-size: 15px; color: var(--sec-ink-2); line-height: 1.6; margin: 0; }
        .hiw-arrow {
          position: absolute; right: -28px; top: 68px; color: var(--sec-ink-3); opacity: 0.35;
        }
        .hiw-arrow svg { width: 40px; height: 12px; }
        @media (max-width: 860px) {
          .hiw-grid { flex-direction: column; align-items: center; }
          .hiw-arrow { display: none; }
        }
      `}</style>
    </section>
  )
}
