import { useReveal } from './hooks.jsx'
import './sections.css'

export default function ContactCTA() {
  const [ref, vis] = useReveal()

  return (
    <section className={`sec contact-cta ${vis ? 'revealed' : ''}`} ref={ref}>
      <div className="cta-inner">
        <h2>Ready to file your taxes the easy way?</h2>
        <p>Start for free. No signup until you're ready to file.</p>
        <a href="https://taxly-taupe.vercel.app/login" className="sec-cta sec-cta-green" style={{ fontSize: 17, padding: '16px 36px' }}>
          Get started — it's free →
        </a>
      </div>

      <style>{`
        .contact-cta {
          background: linear-gradient(160deg, #0B1A33, #132A52);
          text-align: center;
        }
        .cta-inner { max-width: 600px; margin: 0 auto; }
        .contact-cta h2 { color: #fff; margin-bottom: 12px; }
        .contact-cta p { color: rgba(255,255,255,0.7); font-size: 17px; margin-bottom: 32px; }
      `}</style>
    </section>
  )
}
