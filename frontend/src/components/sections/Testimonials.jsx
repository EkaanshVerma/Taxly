import { useReveal } from './hooks.jsx'
import './sections.css'

export default function Testimonials() {
  const [ref, vis] = useReveal()
  const reviews = [
    { quote: "I switched jobs mid-year and thought filing would be a nightmare with two Form 16s. Taxly merged them automatically — took me less time than my lunch break.", name: 'Priya S.', title: 'Software Engineer, Bangalore', initials: 'PS' },
    { quote: "The CA actually caught a deduction I would've missed on my home loan interest. Worth it just for that.", name: 'Arjun M.', title: 'Freelance Designer, Mumbai', initials: 'AM' },
    { quote: "I've used ClearTax before. This was faster and I didn't feel like I was filling out a government form — just texting someone who knew what they were doing.", name: 'Rohit K.', title: 'Product Manager, Pune', initials: 'RK' },
  ]

  return (
    <section className={`sec testimonials ${vis ? 'revealed' : ''}`} ref={ref} style={{ background: '#fff' }}>
      <div className="sec-inner">
        <h2>Loved by early filers</h2>
        <p className="sec-sub">Real feedback from our first cohort of users.</p>
        <div className="tm-grid">
          {reviews.map((r, i) => (
            <div className="sec-card tm-card" key={i}>
              <div className="tm-stars">★★★★★</div>
              <p className="tm-quote">"{r.quote}"</p>
              <div className="tm-author">
                <div className="tm-av">{r.initials}</div>
                <div>
                  <div className="tm-name">{r.name}</div>
                  <div className="tm-title">{r.title} <span className="tm-tag">(early access)</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .tm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .tm-card { display: flex; flex-direction: column; }
        .tm-stars { color: #F5A623; font-size: 16px; letter-spacing: 2px; margin-bottom: 16px; }
        .tm-quote { font-size: 15px; color: var(--sec-ink); line-height: 1.7; font-style: italic; flex: 1; margin: 0 0 20px; }
        .tm-author { display: flex; align-items: center; gap: 12px; }
        .tm-av {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--sec-green), #22A398);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #fff;
        }
        .tm-name { font-weight: 600; color: var(--sec-ink); font-size: 15px; }
        .tm-title { font-size: 13px; color: var(--sec-ink-3); margin-top: 2px; }
        .tm-tag { font-size: 11px; color: var(--sec-ink-3); }
      `}</style>
    </section>
  )
}
