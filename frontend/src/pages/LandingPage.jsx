import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import './LandingPage.css'

/* ── Intersection Observer hook for scroll-reveal ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ── Animated counter ── */
function AnimatedCounter({ target, suffix = '', prefix = '', duration = 1800 }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal(0.3)

  useEffect(() => {
    if (!visible) return
    const start = performance.now()
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * ease))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, target, duration])

  return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>
}

/* ── Typing animation for chat bubble ── */
function TypingText({ text, speed = 35 }) {
  const [shown, setShown] = useState('')
  const [ref, visible] = useReveal(0.2)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!visible || started) return
    setStarted(true)
    let i = 0
    const timer = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [visible, started, text, speed])

  return (
    <span ref={ref}>
      {started ? shown : ''}
      {started && shown.length < text.length && <span className="typing-cursor">|</span>}
    </span>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('taxly-hero-theme') || 'dark')
  const phoneRef = useRef(null)


  useEffect(() => { localStorage.setItem('taxly-hero-theme', theme) }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  // Phone tilt on mouse move
  useEffect(() => {
    const el = phoneRef.current
    if (!el) return
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      el.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg)`
    }
    const handleLeave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)' }
    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave) }
  }, [])

  async function startFiling(e) {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      const userId = uuidv4()
      const res = await createSession(userId)
      navigate(`/chat/${res.data.session_id}`)
    } catch {
      setLoading(false)
      alert("Couldn't connect. Is the backend running?")
    }
  }

  return (
    <div className="landing-container view active">
      <div className="hero-frame" id="heroFrame" data-theme={theme}>
        <div className="announce">
          <span>Filing season is open — file before July 31 to avoid late fees</span>
          <span className="divider">—</span>
          <a href="#" onClick={startFiling}>File taxes now →</a>
        </div>

        <nav>
          <a href="#" onClick={(e) => e.preventDefault()} className="logo">
            <img src="/logo-white.png" alt="Taxly Logo" style={{ height: '140px' }} />
          </a>
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
            <div className="badge fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="avatars"><span>R</span><span>A</span><span>P</span></div>
              <span className="txt">80,000+ filers</span>
              <span className="dot-sep">•</span>
              <span className="txt">CA-reviewed, every time</span>
            </div>
            <h1 className="fade-in-up" style={{ animationDelay: '0.25s' }}>India's plain-English<br/><span className="hl">A.I. and CA</span> tax<br/>filing service</h1>
            <ul className="hero-list fade-in-up" style={{ animationDelay: '0.4s' }}>
              <li>Chat in plain English — <b>no forms, no jargon</b></li>
              <li>A real CA reviews every filing — <b>not just a bot</b></li>
              <li>One flat fee, fully transparent — <b>₹499, nothing hidden</b><br/><span className="refund-guarantee">7-day money-back guarantee if you're not satisfied before XML generation.</span></li>
            </ul>
            <a href="#" onClick={startFiling} className="btn-cta pulse-glow fade-in-up" style={{ animationDelay: '0.55s' }}>
              {loading ? "Starting..." : "Get started — it's free →"}
            </a>
          </div>

          <div className="phone-scene fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="float-chip chip-top float-bounce" style={{ animationDelay: '1s' }}>
              <div><div className="l1">Congratulations</div><div className="l2">₹18,420 refund</div></div>
            </div>
            <div className="iphone" ref={phoneRef}>
              <div className="iphone-body">
                <div className="iphone-screen-wrap">
                  <div className="btn-side btn-mute"></div>
                  <div className="btn-side btn-vol-up"></div>
                  <div className="btn-side btn-vol-down"></div>
                  <div className="btn-side btn-power"></div>
                  <div className="iphone-screen">
                    <div className="dynamic-island"></div>
                    <div className="status-bar"><span>9:41</span></div>
                    <div className="app-summary">
                      <div className="summary-header">
                        <button className="summary-back">‹</button>
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
                        <button className="pay-btn">Download ITR XML →</button>
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

        <div className="trust-bar">
          <div className="trust-label">Built with the rigour of:</div>
          <div className="trust-logos">
            <div className="tl"><b>134</b>&nbsp;automated tax tests</div>
            <div className="tl"><b>₹499</b>&nbsp;flat, CA-reviewed</div>
            <div className="tl"><b>20 min</b>&nbsp;average filing time</div>
            <div className="tl"><b>ITR-1 · ITR-2 · NRI</b>&nbsp;all covered</div>
          </div>
        </div>
      </div>
    </div>
  )
}
