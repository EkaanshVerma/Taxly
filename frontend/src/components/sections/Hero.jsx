import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import './sections.css'

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

export default function Hero() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('taxly-hero-theme') || 'dark')
  const phoneRef = useRef(null)

  // Live real-time clock for iPhone status bar
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date()
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date()
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Interactive phone mini-engine state
  const [phoneSalary, setPhoneSalary] = useState(1240000)
  const [userSelectedRegime, setUserSelectedRegime] = useState(null) // null = auto recommend

  // Tax calculation logic for the phone
  const calculatePhoneTax = (gross) => {
    // Old Regime
    const taxableOld = Math.max(0, gross - 50000 - 150000); // 50k std ded + 1.5L 80C
    let taxOld = 0;
    if (taxableOld <= 500000) {
      taxOld = 0;
    } else {
      if (taxableOld > 1000000) {
        taxOld = 112500 + (taxableOld - 1000000) * 0.30;
      } else if (taxableOld > 500000) {
        taxOld = 12500 + (taxableOld - 500000) * 0.20;
      } else if (taxableOld > 250000) {
        taxOld = (taxableOld - 250000) * 0.05;
      }
      taxOld = Math.round(taxOld * 1.04); // 4% cess
    }

    // New Regime (FY 2025-26 budget slabs)
    const taxableNew = Math.max(0, gross - 75000); // 75k std ded
    let taxNew = 0;
    if (taxableNew <= 700000) {
      taxNew = 0;
    } else {
      if (taxableNew > 1500000) {
        taxNew = 140000 + (taxableNew - 1500000) * 0.30;
      } else if (taxableNew > 1200000) {
        taxNew = 80000 + (taxableNew - 1200000) * 0.20;
      } else if (taxableNew > 1000000) {
        taxNew = 50000 + (taxableNew - 1000000) * 0.15;
      } else if (taxableNew > 700000) {
        taxNew = 20000 + (taxableNew - 700000) * 0.10;
      } else if (taxableNew > 300000) {
        taxNew = (taxableNew - 300000) * 0.05;
      }
      taxNew = Math.round(taxNew * 1.04); // 4% cess
    }

    const estimatedTds = Math.round(gross * 0.082); // typical ~8.2% TDS deduction
    const autoRec = taxOld <= taxNew ? 'old' : 'new';
    const activeRegime = userSelectedRegime || autoRec;
    const finalTax = activeRegime === 'old' ? taxOld : taxNew;
    const refundOrDue = estimatedTds - finalTax;
    const savings = Math.abs(taxOld - taxNew);

    return {
      old: taxOld,
      new: taxNew,
      autoRec,
      activeRegime,
      tds: estimatedTds,
      refundOrDue,
      isRefund: refundOrDue >= 0,
      savings,
      deductions: activeRegime === 'old' ? 234000 : 75000,
    };
  };

  const phoneTax = calculatePhoneTax(phoneSalary);

  useEffect(() => {
    localStorage.setItem('taxly-hero-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return
    const rect = phoneRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotateY = (x / (rect.width / 2)) * 5
    const rotateX = -(y / (rect.height / 2)) * 5
    phoneRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
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
      const userId = uuidv4()
      const res = await createSession(userId)
      navigate(`/chat/${res.data.session_id}`)
    } catch {
      setLoading(false)
      navigate(`/chat/${uuidv4()}`)
    }
  }

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
            <img src={theme === 'light' ? '/logo.png' : '/logo-white.png'} alt="Taxly Logo" style={{ height: '52px' }} />
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
                    
                    {/* Live interactive status bar with real ticking clock & icons */}
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
                        <div className="battery-icon">
                          <div className="battery-fill"></div>
                        </div>
                      </div>
                    </div>

                    <div className="app-summary">
                      <div className="summary-header">
                        <button className="summary-back" onClick={() => setPhoneSalary(1240000)}>‹</button>
                        <div className="summary-title-wrap">
                          <div className="summary-title">Live Tax Estimator</div>
                          <div className="summary-sub">AY 2025–26 · Interactive Preview</div>
                        </div>
                      </div>

                      <div className="summary-body">
                        {/* Interactive Salary Selector Inside Phone */}
                        <div className="phone-salary-card">
                          <div className="phone-salary-label">
                            <span>Your Gross Annual Salary</span>
                            <span className="phone-salary-val">₹{(phoneSalary / 100000).toFixed(1)}L</span>
                          </div>
                          <input
                            type="range"
                            min="400000"
                            max="3000000"
                            step="50000"
                            value={phoneSalary}
                            onChange={(e) => setPhoneSalary(Number(e.target.value))}
                            className="phone-slider"
                          />
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

                        {/* Interactive Summary Card */}
                        <div className="sum-card">
                          <div className="sum-section-label">
                            {phoneTax.isRefund ? 'Estimated Refund Due' : 'Estimated Tax Payable'}
                          </div>
                          <div className="sum-row" style={{ border: 'none', paddingTop: 0 }}>
                            <span className={`sum-row-val big ${phoneTax.isRefund ? 'refund' : 'payable'}`}>
                              ₹{Math.abs(phoneTax.refundOrDue).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">Gross salary</span>
                            <span className="sum-row-val">₹{phoneSalary.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">Basic deductions</span>
                            <span className="sum-row-val">−₹{phoneTax.deductions.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="sum-row">
                            <span className="sum-row-label">TDS credited (~8%)</span>
                            <span className="sum-row-val">₹{phoneTax.tds.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {/* Interactive Regime Comparison Cards */}
                        <div className="sum-card">
                          <div className="sum-section-label">Regime comparison (tap to toggle)</div>
                          <div className="regime-grid">
                            <div
                              className={`regime-card ${phoneTax.activeRegime === 'old' ? 'winner active-regime' : ''}`}
                              onClick={() => setUserSelectedRegime('old')}
                            >
                              <div className="regime-card-label">Old regime</div>
                              <div className="regime-card-amt">₹{(phoneTax.old / 1000).toFixed(0)}K</div>
                              {phoneTax.autoRec === 'old' && <div className="regime-card-badge">Best Choice</div>}
                            </div>
                            <div
                              className={`regime-card ${phoneTax.activeRegime === 'new' ? 'winner active-regime' : ''}`}
                              onClick={() => setUserSelectedRegime('new')}
                            >
                              <div className="regime-card-label">New regime</div>
                              <div className="regime-card-amt">₹{(phoneTax.new / 1000).toFixed(0)}K</div>
                              {phoneTax.autoRec === 'new' && <div className="regime-card-badge">Best Choice</div>}
                            </div>
                          </div>
                        </div>

                        {/* Halfway Prompt & Prompt to Full Tax Calculator */}
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
              +{Math.max(12, Math.round((phoneTax.savings / (phoneSalary || 1)) * 100))}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
