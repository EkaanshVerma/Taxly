import { useState, useEffect } from 'react'

function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    function frame(now) {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [target])
  return val
}

export default function RegimeComparison({ oldTax, newTax, recommended, savings, explanation }) {
  const oldAmt = useCountUp(oldTax)
  const newAmt = useCountUp(newTax)
  const fmt = n => '₹' + n.toLocaleString('en-IN')

  return (
    <>
      <div className="regime-grid">
        <div className={`regime-card ${recommended === 'old' ? 'winner' : ''}`}>
          <div className="regime-card-label">Old regime</div>
          <div className="regime-card-amt">{fmt(oldAmt)}</div>
          {recommended === 'old' && <div className="regime-card-badge">✓ Recommended</div>}
        </div>
        <div className={`regime-card ${recommended === 'new' ? 'winner' : ''}`}>
          <div className="regime-card-label">New regime</div>
          <div className="regime-card-amt">{fmt(newAmt)}</div>
          {recommended === 'new' && <div className="regime-card-badge">✓ Recommended</div>}
        </div>
      </div>
      <div className="savings-tag">
        <div className="savings-icon">💰</div>
        <div className="savings-text">
          <strong>You save {fmt(savings)}</strong>
          {explanation}
        </div>
      </div>
    </>
  )
}
