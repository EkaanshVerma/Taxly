import { AnimatedCounter } from './hooks.jsx'
import './sections.css'

export default function TrustBar() {
  return (
    <div className="trust-counter-bar">
      <div className="tcb-grid">
        <div className="tcb-item">
          <div className="tcb-num"><AnimatedCounter target={80000} suffix="+" /></div>
          <div className="tcb-label">Returns filed</div>
        </div>
        <div className="tcb-div" />
        <div className="tcb-item">
          <div className="tcb-num"><AnimatedCounter target={134} /></div>
          <div className="tcb-label">Automated tax tests</div>
        </div>
        <div className="tcb-div" />
        <div className="tcb-item">
          <div className="tcb-num"><AnimatedCounter target={20} suffix=" min" /></div>
          <div className="tcb-label">Average filing time</div>
        </div>
        <div className="tcb-div" />
        <div className="tcb-item">
          <div className="tcb-num">₹<AnimatedCounter target={499} /></div>
          <div className="tcb-label">Flat fee, CA-reviewed</div>
        </div>
      </div>

      <style>{`
        .trust-counter-bar { background: #0B1A33; padding: 56px 24px; }
        .tcb-grid {
          max-width: 1000px; margin: 0 auto;
          display: flex; align-items: center; justify-content: center;
        }
        .tcb-item { flex: 1; text-align: center; padding: 16px; }
        .tcb-num { font-family: var(--sec-serif, 'Bodoni Moda', serif); font-size: 42px; font-weight: 500; color: #fff; }
        .tcb-label { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; font-weight: 500; }
        .tcb-div { width: 1px; height: 56px; background: rgba(255,255,255,0.12); flex-shrink: 0; }
        @media (max-width: 768px) {
          .tcb-grid { flex-direction: column; gap: 8px; }
          .tcb-div { width: 56px; height: 1px; }
        }
      `}</style>
    </div>
  )
}
