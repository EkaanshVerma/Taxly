import { useState } from 'react'
import { useReveal } from './hooks.jsx'
import './sections.css'

export default function FAQ() {
  const [ref, vis] = useReveal()
  const [open, setOpen] = useState(null)
  const faqs = [
    { q: 'Is my data safe?', a: 'Yes. Bank statements are parsed in memory and discarded — we never store raw files. All data is encrypted at rest and in transit. We follow SOC-2 aligned security practices.' },
    { q: 'Do I still need to upload the XML to the Income Tax portal myself?', a: 'Yes. Taxly generates the ITR XML file for you. You then upload it to the Income Tax e-filing portal (incometax.gov.in) yourself. We provide step-by-step instructions.' },
    { q: 'What if the AI makes a mistake?', a: 'Every AI flag is reviewed by a real Chartered Accountant before anything is filed. The AI suggests — the CA decides. Nothing gets auto-claimed without human sign-off.' },
    { q: 'Can I get a refund?', a: 'Yes. We offer a 7-day money-back guarantee if you\'re not satisfied before XML generation. No questions asked.' },
    { q: 'Which ITR forms do you support?', a: 'Currently ITR-1 (Sahaj), ITR-2, ITR-3, and ITR-4 (Sugam). This covers salaried individuals, capital gains, business/professional income, and freelancers.' },
    { q: 'What documents do I need?', a: 'At minimum, your Form 16. For the AI + CA plan, your bank statement for the financial year. Optionally: rent receipts, home loan certificate, and investment proofs.' },
  ]

  return (
    <section className={`sec faq ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: 'var(--sec-paper)' }}>
      <div className="sec-inner" style={{ maxWidth: 720 }}>
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className={`faq-item ${open === i ? 'faq-open' : ''}`} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-arrow">{open === i ? '−' : '+'}</span>
              </button>
              <div className="faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .faq-list { display: flex; flex-direction: column; gap: 0; margin-top: 40px; }
        .faq-item { border-bottom: 1px solid var(--sec-paper-3); }
        .faq-q {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 20px 0; background: none; border: none; cursor: pointer;
          font-size: 16px; font-weight: 600; color: var(--sec-ink); text-align: left;
          font-family: var(--sec-sans); gap: 16px;
        }
        .faq-q:hover { color: var(--sec-blue); }
        .faq-arrow { font-size: 22px; color: var(--sec-ink-3); flex-shrink: 0; transition: transform 0.2s; }
        .faq-a {
          max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.35s ease;
          padding: 0;
        }
        .faq-open .faq-a { max-height: 200px; padding: 0 0 20px; }
        .faq-a p { margin: 0; font-size: 15px; color: var(--sec-ink-2); line-height: 1.7; }
      `}</style>
    </section>
  )
}
