import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import './sections.css'

// ─── Animated number flip ──────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = '₹', suffix = '' }) {
  const [display, setDisplay] = useState(value)
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    setFlash(true)
    const steps = 14
    const start = prevRef.current
    const end = value
    let step = 0
    const timer = setInterval(() => {
      step++
      const t = step / steps
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      setDisplay(Math.round(start + (end - start) * eased))
      if (step >= steps) {
        clearInterval(timer)
        setDisplay(end)
        setTimeout(() => setFlash(false), 300)
      }
    }, 18)
    prevRef.current = value
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className={`anim-num ${flash ? 'anim-flash' : ''}`}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}

// ─── Typing text ──────────────────────────────────────────────────────────────
function TypingText({ text, speed = 25 }) {
  const [displayed, setDisplayed] = useState('')
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[index])
        setIndex(i => i + 1)
      }, speed)
      return () => clearTimeout(timer)
    }
  }, [index, text, speed])
  return <span>{displayed}<span className="typing-cursor">|</span></span>
}

// ─── Tax engine ───────────────────────────────────────────────────────────────
function calcTax(gross, deductions) {
  const { hra, d80c, d80d } = deductions
  const totalOldDed = 50000 + d80c + hra + d80d   // std + 80C + HRA + 80D
  const taxableOld = Math.max(0, gross - totalOldDed)
  let taxOld = 0
  if (taxableOld > 1000000) taxOld = 112500 + (taxableOld - 1000000) * 0.30
  else if (taxableOld > 500000) taxOld = 12500 + (taxableOld - 500000) * 0.20
  else if (taxableOld > 250000) taxOld = (taxableOld - 250000) * 0.05
  if (taxableOld > 500000) taxOld = Math.round(taxOld * 1.04)
  else taxOld = 0   // 87A rebate

  const taxableNew = Math.max(0, gross - 75000)
  let taxNew = 0
  if (taxableNew > 1500000) taxNew = 140000 + (taxableNew - 1500000) * 0.30
  else if (taxableNew > 1200000) taxNew = 80000 + (taxableNew - 1200000) * 0.20
  else if (taxableNew > 1000000) taxNew = 50000 + (taxableNew - 1000000) * 0.15
  else if (taxableNew > 700000) taxNew = 20000 + (taxableNew - 700000) * 0.10
  else if (taxableNew > 300000) taxNew = (taxableNew - 300000) * 0.05
  if (taxableNew > 700000) taxNew = Math.round(taxNew * 1.04)
  else taxNew = 0

  const tds = Math.round(gross * 0.082)
  const autoRec = taxOld <= taxNew ? 'old' : 'new'
  const savings = Math.abs(taxOld - taxNew)
  return { old: taxOld, new: taxNew, autoRec, tds, savings, taxableOld, totalOldDed }
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export default function Hero() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('taxly-hero-theme') || 'dark')
  const phoneRef = useRef(null)

  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  })
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // ── Phone state ─────────────────────────────────────────────────────────────
  const [phoneSalary, setPhoneSalary] = useState(1800000)
  const [activeRegime, setActiveRegime] = useState(null) // null = auto
  const [deductions, setDeductions] = useState({ hra: 120000, d80c: 150000, d80d: 25000 })
  const [showDeductions, setShowDeductions] = useState(false)
  const [justSwitchedRegime, setJustSwitchedRegime] = useState(false)
  const [sliderDragging, setSliderDragging] = useState(false)

  const tax = calcTax(phoneSalary, deductions)
  const regime = activeRegime || tax.autoRec
  const finalTax = tax[regime]
  const refundOrDue = tax.tds - finalTax
  const isRefund = refundOrDue >= 0

  function switchRegime(r) {
    setActiveRegime(r)
    setJustSwitchedRegime(true)
    setTimeout(() => setJustSwitchedRegime(false), 600)
  }

  function toggleDeduction(key, amounts) {
    setDeductions(d => ({
      ...d,
      [key]: d[key] > 0 ? 0 : amounts[key]
    }))
  }

  useEffect(() => { localStorage.setItem('taxly-hero-theme', theme) }, [theme])
  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light')

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return
    const rect = phoneRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const ry = (x / (rect.width / 2)) * 6
    const rx = -(y / (rect.height / 2)) * 6
    phoneRef.current.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`
  }
  const handleMouseLeave = () => {
    if (!phoneRef.current) return
    phoneRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
  }

  const startFiling = async (e) => {
    if (e) e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await createSession(uuidv4())
      navigate(`/chat/${res.data.session_id}`)
    } catch {
      setLoading(false)
      navigate(`/chat/${uuidv4()}`)
    }
  }

  const salaryL = (phoneSalary / 100000).toFixed(1)

  return (
    <div className="landing-container">
      <div className="hero-frame" id="heroFrame" data-theme={theme}>
        <div className="announce">
          <span>Filing season is open — AY 2025–26</span>
          <span className="divider">—</span>
          <a href="#" onClick={startFiling}>File taxes now →</a>
        </div>

        <nav>
          <Link to="/" className="logo">
            <img src={theme === 'light' ? '/logo.png' : '/logo-white.png'} alt="Taxly Logo" style={{ height: '92px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <ul className="nav-links">
            <li><a href="#" onClick={startFiling}>File Taxes</a></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/features/bank-statement-review">How Taxly Works</Link></li>
            <li><Link to="/for-cas">For CAs</Link></li>
            <li>
              <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark mode">
                <svg className="icon-sun" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                <svg className="icon-moon" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              </button>
            </li>
          </ul>
          <a href="#" onClick={startFiling} className="btn-nav">{loading ? "Starting..." : "Get started — it's free"}</a>
        </nav>

        <div className="hero-body">
          <div className="hero-text-col">
            <div className="badge fade-in-up">
              <div className="avatars"><span>R</span><span>A</span><span>P</span></div>
              <span className="txt">80,000+ filers</span>
              <span className="dot-sep">•</span>
              <span className="txt">CA-reviewed, every time</span>
            </div>
            <h1 className="fade-in-up">India's plain-English<br/><span className="hl">A.I. and CA</span> tax<br/>filing service</h1>
            <ul className="hero-list fade-in-up">
              <li>Chat in plain English — <b>no forms, no jargon</b></li>
              <li>A real CA reviews every filing — <b>not just a bot</b></li>
              <li>One flat fee, fully transparent — <b>₹499, nothing hidden</b><br/><span className="refund-guarantee">7-day money-back guarantee if you're not satisfied before XML generation.</span></li>
            </ul>
            <a href="#" onClick={startFiling} className="btn-cta pulse-glow fade-in-up">
              {loading ? "Starting..." : "Get started — it's free →"}
            </a>
          </div>

          <div className="phone-scene" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="iphone-wrap">
              <div className="iphone" ref={phoneRef}>
                <div className="iphone-body">
                  <div className="btn-side btn-mute"></div>
                  <div className="btn-side btn-vol-up"></div>
                  <div className="btn-side btn-vol-down"></div>
                  <div className="btn-side btn-power"></div>
                  <div className="iphone-screen">
                    <div className="dynamic-island">
                      <div className="island-indicator"></div>
                    </div>

                    {/* Status bar */}
                    <div className="status-bar">
                      <span className="status-time">{currentTime}</span>
                      <div className="status-icons">
                        <svg className="status-icon" viewBox="0 0 16 12" width="12" height="10" fill="currentColor">
                          <rect x="0" y="8" width="2" height="4" rx="0.5" />
                          <rect x="4" y="5" width="2" height="7" rx="0.5" />
                          <rect x="8" y="2" width="2" height="10" rx="0.5" />
                          <rect x="12" y="0" width="2" height="12" rx="0.5" />
                        </svg>
                        <svg className="status-icon" viewBox="0 0 16 12" width="12" height="10" fill="currentColor">
                          <path d="M8 10a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-4.2-3.2a6 6 0 0 1 8.4 0 .8.8 0 0 1-1.1 1.1 4.5 4.5 0 0 0-6.2 0 .8.8 0 0 1-1.1-1.1zm-2.8-2.8a10 10 0 0 1 14 0 .8.8 0 0 1-1.1 1.1 8.5 8.5 0 0 0-11.8 0 .8.8 0 0 1-1.1-1.1z" />
                        </svg>
                        <div className="battery-icon"><div className="battery-fill"></div></div>
                      </div>
                    </div>

                    <div className="app-summary">
                      {/* Header */}
                      <div className="summary-header">
                        <button className="summary-back" onClick={() => { setPhoneSalary(1800000); setActiveRegime(null) }}>‹</button>
                        <div className="summary-title-wrap">
                          <div className="summary-title">Live Tax Estimator</div>
                          <div className="summary-sub">AY 2025–26 · Interactive Preview</div>
                        </div>
                      </div>

                      <div className="summary-body">

                        {/* ── Salary Slider ── */}
                        <div className="phone-salary-card">
                          <div className="phone-salary-label">
                            <span>Your Gross Annual Salary</span>
                            <span className="phone-salary-val">₹{salaryL}L</span>
                          </div>
                          <div className="slider-track-wrap">
                            <input
                              type="range"
                              min="400000"
                              max="3000000"
                              step="50000"
                              value={phoneSalary}
                              onMouseDown={() => setSliderDragging(true)}
                              onMouseUp={() => setSliderDragging(false)}
                              onTouchStart={() => setSliderDragging(true)}
                              onTouchEnd={() => setSliderDragging(false)}
                              onChange={e => setPhoneSalary(Number(e.target.value))}
                              className={`phone-slider${sliderDragging ? ' dragging' : ''}`}
                              style={{
                                '--pct': `${((phoneSalary - 400000) / (3000000 - 400000)) * 100}%`
                              }}
                            />
                          </div>
                          <div className="phone-presets">
                            {[800000, 1240000, 1800000, 2500000].map(amt => (
                              <button
                                key={amt}
                                className={`phone-preset-btn ${phoneSalary === amt ? 'active' : ''}`}
                                onClick={() => setPhoneSalary(amt)}
                              >
                                ₹{amt / 100000}L
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── Tax result ── */}
                        <div className={`sum-card ${justSwitchedRegime ? 'card-flash' : ''}`}>
                          <div className="sum-section-label">
                            {isRefund ? '🟢 Estimated Refund Due' : '🟡 Estimated Tax Payable'}
                          </div>
                          <div className="sum-row" style={{ border: 'none', paddingTop: 0 }}>
                            <span className={`sum-row-val big ${isRefund ? 'refund' : 'payable'}`}>
                              <AnimatedNumber value={Math.abs(refundOrDue)} />
                            </span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">Gross salary</span>
                            <span className="sum-row-val">₹{phoneSalary.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">Basic deductions</span>
                            <span className="sum-row-val">−₹{tax.totalOldDed.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">TDS credited (~8%)</span>
                            <span className="sum-row-val">₹{tax.tds.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* ── Regime toggle ── */}
                        <div className="sum-card">
                          <div className="sum-section-label">Regime comparison (tap to toggle)</div>
                          <div className="regime-grid">
                            {['old', 'new'].map(r => (
                              <div
                                key={r}
                                className={`regime-card ${regime === r ? 'active-regime' : ''} ${tax.autoRec === r ? 'winner' : ''}`}
                                onClick={() => switchRegime(r)}
                              >
                                <div className="regime-card-label">{r === 'old' ? 'Old' : 'New'} regime</div>
                                <div className="regime-card-amt">
                                  <AnimatedNumber value={Math.round(tax[r] / 1000)} prefix="₹" suffix="K" />
                                </div>
                                {tax.autoRec === r && <div className="regime-card-badge">Best Choice</div>}
                              </div>
                            ))}
                          </div>
                          {tax.savings > 0 && (
                            <div className="regime-savings-row">
                              <span className="regime-savings-icon">💡</span>
                              <span>Switch to {tax.autoRec} regime → save <b>₹{Math.round(tax.savings / 1000)}K</b></span>
                            </div>
                          )}
                        </div>

                        {/* ── Deduction toggles ── */}
                        <div className="sum-card deduction-toggles">
                          <div className="sum-section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Deductions</span>
                            <button className="deduction-expand-btn" onClick={() => setShowDeductions(s => !s)}>
                              {showDeductions ? '▲ Hide' : '▼ Edit'}
                            </button>
                          </div>
                          {showDeductions && (
                            <div className="deduction-list">
                              {[
                                { key: 'hra', label: 'HRA Exemption', amount: 120000 },
                                { key: 'd80c', label: '80C (PPF/LIC)', amount: 150000 },
                                { key: 'd80d', label: '80D Medical', amount: 25000 },
                              ].map(({ key, label, amount }) => (
                                <label key={key} className="deduction-row">
                                  <div className="ded-info">
                                    <span className="ded-label">{label}</span>
                                    <span className="ded-amt">₹{amount.toLocaleString('en-IN')}</span>
                                  </div>
                                  <div
                                    className={`ded-toggle ${deductions[key] > 0 ? 'on' : 'off'}`}
                                    onClick={() => toggleDeduction(key, { hra: 120000, d80c: 150000, d80d: 25000 })}
                                  >
                                    <div className="ded-toggle-knob" />
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                          {!showDeductions && (
                            <div className="deduction-summary-row">
                              <span className="ded-active-count">
                                {Object.values(deductions).filter(v => v > 0).length} deductions active
                              </span>
                              <span className="ded-total">−₹{Object.values(deductions).reduce((a, b) => a + b, 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>

                        {/* ── Halfway prompt ── */}
                        <div className="phone-calc-prompt">
                          <div className="phone-prompt-head">
                            <span className="phone-pulse-dot"></span>
                            <strong>Halfway estimated!</strong>
                          </div>
                          <p className="phone-prompt-text">
                            HRA exemption, 80D medical &amp; 121+ deductions are pending CA review.
                          </p>
                        </div>

                        <button className="pay-btn phone-cta-btn" onClick={startFiling}>
                          Calculate full tax &amp; deductions →
                        </button>
                      </div>
                    </div>
                    <div className="home-indicator"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="float-chip chip-chat float-bounce" style={{ animationDelay: '1.4s' }}>
              <div className="av">T</div>
              <div className="txt"><b>Taxly:</b> <TypingText text="Hi! I'll help you file in 20 minutes. What's your gross salary?" /></div>
            </div>
            <div className="float-chip chip-pct float-bounce" style={{ animationDelay: '1.8s' }}>
              +{Math.max(12, Math.round((tax.savings / (phoneSalary || 1)) * 100))}%
            </div>
          </div>
        </div>
      </div>

      {/* Interactive styles scoped inside Hero */}
      <style>{`
        /* Animated number flash */
        .anim-num { transition: color 0.2s; display: inline-block; }
        .anim-flash { animation: numPop 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes numPop {
          0%   { transform: scale(1);    color: inherit; }
          40%  { transform: scale(1.08); color: #1B4FD8; }
          100% { transform: scale(1);    color: inherit; }
        }

        /* Card flash on regime switch */
        .card-flash { animation: cardFlash 0.4s ease; }
        @keyframes cardFlash {
          0%   { background: rgba(13,122,95,0.12); }
          100% { background: #fff; }
        }

        /* Slider with gradient fill */
        .slider-track-wrap { position: relative; }
        .phone-slider {
          width: 100%; height: 4px; cursor: pointer; border-radius: 2px;
          -webkit-appearance: none; appearance: none; outline: none;
          background: linear-gradient(to right, #1B4FD8 var(--pct, 50%), #E2E1DC var(--pct, 50%));
          transition: height 0.15s;
        }
        .phone-slider.dragging { height: 6px; }
        .phone-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px;
          border-radius: 50%; background: #1B4FD8;
          border: 2px solid #fff; box-shadow: 0 2px 8px rgba(27,79,216,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: grab;
        }
        .phone-slider.dragging::-webkit-slider-thumb {
          transform: scale(1.3);
          box-shadow: 0 2px 16px rgba(27,79,216,0.6);
          cursor: grabbing;
        }

        /* Regime savings hint */
        .regime-savings-row {
          display: flex; align-items: center; gap: 5px;
          margin-top: 6px; font-size: 8.5px; color: #0D7A5F; font-weight: 600;
          background: rgba(13,122,95,0.08); border-radius: 6px; padding: 4px 7px;
          animation: fadeIn 0.3s ease;
        }
        .regime-savings-icon { font-size: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; } }

        /* Deduction toggles */
        .deduction-toggles { cursor: default; }
        .deduction-expand-btn {
          background: none; border: none; font-size: 8px; color: #1B4FD8;
          font-weight: 700; cursor: pointer; font-family: var(--mono); padding: 0;
        }
        .deduction-list { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        .deduction-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; cursor: pointer;
        }
        .ded-info { display: flex; flex-direction: column; flex: 1; }
        .ded-label { font-size: 9px; color: #1e293b; font-weight: 600; }
        .ded-amt { font-size: 8px; color: #64748b; font-family: var(--mono); }
        .ded-toggle {
          width: 28px; height: 16px; border-radius: 999px; position: relative;
          transition: background 0.2s; flex-shrink: 0;
        }
        .ded-toggle.on { background: #0D7A5F; }
        .ded-toggle.off { background: #CBD5E1; }
        .ded-toggle-knob {
          position: absolute; top: 2px; width: 12px; height: 12px;
          border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ded-toggle.on  .ded-toggle-knob { left: 14px; }
        .ded-toggle.off .ded-toggle-knob { left: 2px; }

        .deduction-summary-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 4px; font-size: 8.5px;
        }
        .ded-active-count { color: #64748b; }
        .ded-total { color: #0D7A5F; font-weight: 700; font-family: var(--mono); }
      `}</style>
    </div>
  )
}
