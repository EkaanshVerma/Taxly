import { useReveal } from './hooks.jsx'
import './sections.css'

export default function PricingTiers() {
  const [ref, vis] = useReveal()
  const tiers = [
    {
      name: 'Self-file', price: '₹199', tag: null,
      desc: 'For simple returns. Fully automated, no CA involved.',
      features: [
        'Chat-based interview',
        'Auto-parses Form 16',
        'Tax calculation, 121+ scenarios',
        'Old vs new regime comparison',
        'ITR XML download',
      ],
    },
    {
      name: 'AI + CA Verified', price: '₹999', tag: 'Most chosen',
      desc: 'AI reviews your bank statement. A CA verifies every flag.',
      features: [
        'Everything in Self-file',
        'Parses all TDS certificate types (16A–16D)',
        'AI bank statement analysis',
        'Deduction suggestions with required proof',
        'CA verifies every AI flag',
        'Priority support',
      ],
    },
    {
      name: 'Full Advisory', price: '₹1,999', tag: null,
      desc: 'For business income, multiple properties, or real planning needs.',
      features: [
        'Everything in AI + CA Verified',
        'Dedicated CA consultation',
        'Multi-year regime planning',
        'Notice-risk review',
        'ITR-3/4 support for business income',
      ],
    },
  ]

  return (
    <section className={`sec pricing ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: 'var(--sec-paper)' }}>
      <div className="sec-inner">
        <h2>Simple pricing. No surprises.</h2>
        <p className="sec-sub">Pick what fits. Upgrade anytime during your filing.</p>
        <div className="pr-grid">
          {tiers.map((t, i) => (
            <div className={`pr-card ${i === 1 ? 'pr-featured' : ''}`} key={i}>
              {t.tag && <div className="pr-tag">{t.tag}</div>}
              <div className="pr-name">{t.name}</div>
              <div className="pr-price">{t.price}</div>
              <p className="pr-desc">{t.desc}</p>
              <ul className="pr-list">
                {t.features.map((f, j) => <li key={j}><span className="pr-check">✓</span>{f}</li>)}
              </ul>
              <a href="https://taxly-taupe.vercel.app/login" className={`sec-cta ${i === 1 ? 'sec-cta-blue' : ''}`} style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                Get started
              </a>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .pr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; }
        .pr-card {
          background: #fff; border: 1.5px solid var(--sec-paper-3); border-radius: 20px;
          padding: 36px 28px; display: flex; flex-direction: column; position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .pr-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.06); }
        .pr-featured {
          border-color: var(--sec-blue); box-shadow: 0 0 0 1px var(--sec-blue), 0 8px 32px rgba(27,79,216,0.1);
          transform: scale(1.02);
        }
        .pr-featured:hover { transform: scale(1.02) translateY(-4px); }
        .pr-tag {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--sec-blue); color: #fff; font-size: 12px; font-weight: 700;
          padding: 4px 16px; border-radius: 999px; white-space: nowrap;
        }
        .pr-name { font-size: 20px; font-weight: 700; color: var(--sec-ink); margin-bottom: 8px; }
        .pr-price { font-family: var(--sec-serif); font-size: 44px; color: var(--sec-ink); margin-bottom: 12px; }
        .pr-desc { font-size: 14px; color: var(--sec-ink-2); line-height: 1.5; margin-bottom: 24px; }
        .pr-list { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 10px; }
        .pr-list li { font-size: 14px; color: var(--sec-ink-2); display: flex; align-items: flex-start; gap: 8px; }
        .pr-check { color: var(--sec-green); font-weight: 700; flex-shrink: 0; }
        @media (max-width: 860px) { .pr-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; } .pr-featured { transform: none; } }
      `}</style>
    </section>
  )
}
