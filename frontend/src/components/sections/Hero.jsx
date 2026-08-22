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

  useEffect(() => {
    localStorage.setItem('taxly-hero-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const handleMouseMove = (e) => {
    if (!phoneRef.current) return
    const rect = phoneRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const rotateY = (x / (rect.width / 2)) * 6
    const rotateX = -(y / (rect.height / 2)) * 6
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
      alert("Couldn't connect to backend. Starting local session...")
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
              <div className="iphone-screen">
                <div className="dynamic-island"><span className="sensor"></span></div>
                <div className="app-frame">
                  <div className="app-topbar">
                    <img src="/logo.png" alt="Taxly Logo" className="app-brand-logo" />
                    <span className="status-pill green">AI Active</span>
                  </div>
                  <div className="summary-view">
                    <div className="summary-hdr">
                      <div className="summary-badge">✓ Calculations Complete</div>
                      <div className="summary-title-wrap">
                        <div className="summary-title">Your filing</div>
                        <div className="summary-sub">AY 2025–26 · ITR-1</div>
                      </div>
                    </div>
                    <div className="summary-body">
                      <div className="sum-card">
                        <div className="sum-section-label">Total refund due</div>
                        <div className="sum-row" style={{ border: 'none', paddingTop: 0 }}><span className="sum-row-val big">₹18,420</span></div>
                        <div className="sum-row"><span className="sum-row-label">Gross salary</span><span className="sum-row-val">₹12,40,000</span></div>
                        <div className="sum-row"><span className="sum-row-label">Deductions</span><span className="sum-row-val">−₹2,34,000</span></div>
                        <div className="sum-row"><span className="sum-row-label">TDS paid</span><span className="sum-row-val">₹1,00,500</span></div>
                      </div>
                      <div className="sum-card">
                        <div className="sum-section-label">Regime comparison</div>
                        <div className="regime-grid">
                          <div className="regime-card winner">
                            <div className="regime-card-label">Old regime</div>
                            <div className="regime-card-amt">₹82K</div>
                            <div className="regime-card-badge">Recommended</div>
                          </div>
                          <div className="regime-card">
                            <div className="regime-card-label">New regime</div>
                            <div className="regime-card-amt">₹96K</div>
                          </div>
                        </div>
                      </div>
                      <div className="savings-tag">
                        <div className="savings-text"><strong>CA-reviewed &amp; approved</strong>Saved ₹13,520 vs. New Regime</div>
                      </div>
                      <button className="pay-btn" onClick={startFiling}>Download ITR XML →</button>
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
          <div className="float-chip chip-pct float-bounce" style={{ animationDelay: '1.8s' }}>+18%</div>
        </div>
      </div>
    </div>
  </div>
  )
}
