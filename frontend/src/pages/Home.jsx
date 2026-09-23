import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('taxly_theme') || 'dark')

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('taxly_theme', nextTheme)
  }, [theme])

  // ── Session start / Start filing ─────────────────────────────────────────────
  const startFiling = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const res = await createSession(uuidv4())
      if (res?.data?.session_id) {
        navigate(`/chat/${res.data.session_id}`)
      } else {
        navigate(`/chat/${uuidv4()}`)
      }
    } catch {
      navigate(`/chat/${uuidv4()}`)
    } finally {
      setLoading(false)
    }
  }, [loading, navigate])

  // ── Reduced motion check ───────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Background color sync & Theme application ─────────────────────────────
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.backgroundColor = theme === 'dark' ? '#0A0E14' : '#F8FAF6'
    return () => {
      document.body.style.backgroundColor = prevBg
    }
  }, [theme])

  // ── 1. Reveal on scroll ────────────────────────────────────────────────────
  useEffect(() => {
    const revealEls = document.querySelectorAll('.home-page .rv')
    if ('IntersectionObserver' in window && !reduceMotion) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('seen')
            obs.unobserve(e.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
      revealEls.forEach((el) => obs.observe(el))
      return () => obs.disconnect()
    } else {
      revealEls.forEach((el) => el.classList.add('seen'))
    }
  }, [reduceMotion])

  // ── 2. Text scramble on hero — smooth CodeRabbit style (two words after It's) ────
  const scrambleRef = useRef(null)
  useEffect(() => {
    const el = scrambleRef.current
    if (!el) return

    const phrases = [
      'catching deductions.',
      'proving claims.',
      'flagging risks.',
      'optimizing refunds.'
    ]

    if (reduceMotion) {
      el.textContent = phrases[0]
      return
    }

    class TextScramble {
      constructor(targetEl) {
        this.el = targetEl
        this.chars = 'abcdefghijklmnopqrstuvwxyz'
        this.update = this.update.bind(this)
      }

      setText(newText) {
        const oldText = this.el.textContent || ''
        const length = Math.max(oldText.length, newText.length)
        const promise = new Promise((resolve) => {
          this.resolve = resolve
        })
        this.queue = []

        for (let i = 0; i < length; i++) {
          const from = oldText[i] || ''
          const to = newText[i] || ''
          const start = Math.floor(i * 2.4)
          const end = start + 14 + Math.floor(Math.random() * 8)
          this.queue.push({ from, to, start, end, char: '' })
        }

        cancelAnimationFrame(this.frameReq)
        this.frame = 0
        this.update()
        return promise
      }

      update() {
        let output = ''
        let complete = 0

        for (let i = 0; i < this.queue.length; i++) {
          let { from, to, start, end, char } = this.queue[i]
          if (this.frame >= end) {
            complete++
            output += to
          } else if (this.frame >= start) {
            if (to === ' ' || from === ' ') {
              output += ' '
            } else if (to === '.' || from === '.') {
              output += '.'
            } else {
              if (!char || Math.random() < 0.3) {
                char = this.chars[Math.floor(Math.random() * this.chars.length)]
                this.queue[i].char = char
              }
              output += `<span class="sc-char glitch">${char}</span>`
            }
          } else {
            output += from
          }
        }

        this.el.innerHTML = output

        if (complete === this.queue.length) {
          if (this.resolve) this.resolve()
        } else {
          this.frameReq = requestAnimationFrame(this.update)
          this.frame++
        }
      }

      destroy() {
        cancelAnimationFrame(this.frameReq)
      }
    }

    const fx = new TextScramble(el)
    let idx = 0
    let timeoutId = null
    let isCancelled = false

    const next = () => {
      if (isCancelled) return
      idx = (idx + 1) % phrases.length
      fx.setText(phrases[idx]).then(() => {
        if (!isCancelled) {
          timeoutId = setTimeout(next, 3400)
        }
      })
    }

    timeoutId = setTimeout(next, 3400)

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
      fx.destroy()
    }
  }, [reduceMotion])

  // ── 3. Hero Rail Carousel ──────────────────────────────────────────────────
  const [railIndex, setRailIndex] = useState(0)
  const [railPaused, setRailPaused] = useState(false)
  const [progKey, setProgKey] = useState(0)

  const showRail = useCallback((i) => {
    setRailIndex(i)
    setProgKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (reduceMotion || railPaused) return
    const timer = setInterval(() => {
      setRailIndex((prev) => (prev + 1) % 4)
      setProgKey((prev) => prev + 1)
    }, 7000)
    return () => clearInterval(timer)
  }, [reduceMotion, railPaused])

  // ── 4. Scroll-pinned Context Section ───────────────────────────────────────
  const ctxItems = [
    { id: 'n1', title: 'Form 16 & TDS certificates', desc: 'All five certificate types, auto-detected and merged — including two Form 16s from a mid-year job switch.' },
    { id: 'n2', title: 'Bank statement', desc: 'Every credit and debit read line by line, categorised, and cross-checked against what you declared.' },
    { id: 'n3', title: 'Capital gains statements', desc: 'Broker and AMC reports parsed for LTCG, STCG, and the Jan-2018 grandfathering cost where it applies.' },
    { id: 'n4', title: 'Your own answers', desc: "What the documents can't say — rent paid, residency status, who depends on you, what you actually did this year." },
    { id: 'n5', title: 'The tax engine', desc: 'Deterministic Python with 134 tests applies the Act to whatever the other four sources produced.' },
    { id: 'n6', title: 'A chartered accountant', desc: 'The final layer. Everything flagged as uncertain lands on a human before a single rupee is filed.' }
  ]

  const [activeCtx, setActiveCtx] = useState(0)
  const railFillRef = useRef(null)
  const ctxListRef = useRef(null)

  const updateRailFill = useCallback((idx) => {
    if (!ctxListRef.current || !railFillRef.current) return
    const items = ctxListRef.current.querySelectorAll('.ctx-item')
    if (items[idx]) {
      railFillRef.current.style.top = items[idx].offsetTop + 'px'
      railFillRef.current.style.height = items[idx].offsetHeight + 'px'
    }
  }, [])

  const selectCtx = useCallback((idx) => {
    setActiveCtx(idx)
    updateRailFill(idx)
  }, [updateRailFill])

  useEffect(() => {
    updateRailFill(activeCtx)
    const handleResize = () => updateRailFill(activeCtx)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeCtx, updateRailFill])

  useEffect(() => {
    if (reduceMotion) return
    const handleScroll = () => {
      if (!ctxListRef.current) return
      const listRect = ctxListRef.current.getBoundingClientRect()
      if (listRect.top < window.innerHeight && listRect.bottom > 0) {
        const mid = window.innerHeight * 0.45
        const items = ctxListRef.current.querySelectorAll('.ctx-item')
        let best = 0
        let bestDist = Infinity
        items.forEach((it, i) => {
          const r = it.getBoundingClientRect()
          const d = Math.abs((r.top + r.height / 2) - mid)
          if (d < bestDist) {
            bestDist = d
            best = i
          }
        })
        setActiveCtx((prev) => {
          if (prev !== best) {
            updateRailFill(best)
            return best
          }
          return prev
        })
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [reduceMotion, updateRailFill])

  // ── 5. Live Tax Calculator ─────────────────────────────────────────────────
  const [sal, setSal] = useState(1240000)
  const [c80, setC80] = useState(150000)
  const [rent, setRent] = useState(216000)
  const [d80, setD80] = useState(25000)

  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

  const slabTax = (inc, slabs) => {
    let tax = 0
    let prev = 0
    for (let i = 0; i < slabs.length; i++) {
      const s = slabs[i]
      if (inc > prev) {
        tax += (Math.min(inc, s.upTo) - prev) * s.rate
        prev = s.upTo
      } else break
    }
    return tax
  }

  const OLD_SLABS = [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 }
  ]
  const NEW_SLABS = [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 }
  ]

  const basic = sal * 0.5
  const hra = Math.max(0, Math.min(rent - 0.1 * basic, 0.5 * basic))
  const oldTaxable = Math.max(0, sal - 50000 - c80 - d80 - hra)
  let rawOldTax = slabTax(oldTaxable, OLD_SLABS)
  if (oldTaxable <= 500000) rawOldTax = Math.max(0, rawOldTax - 12500)
  const oldTax = rawOldTax * 1.04

  const newTaxable = Math.max(0, sal - 75000)
  let rawNewTax = slabTax(newTaxable, NEW_SLABS)
  if (newTaxable <= 700000) rawNewTax = Math.max(0, rawNewTax - 25000)
  const newTax = rawNewTax * 1.04

  const oldWins = oldTax <= newTax
  const gap = Math.abs(oldTax - newTax)
  const saveNote = gap < 500
    ? 'Almost identical either way — at this income the regimes converge.'
    : (oldWins
      ? 'Your deductions outweigh the bigger standard deduction, so the old regime wins.'
      : 'You are not claiming enough deductions to beat the ₹75,000 standard deduction.')

  // ── 6. Statement AI interactive triage ─────────────────────────────────────
  const initialFlags = [
    {
      id: 'flag-1',
      txn: 'NEFT CR · ACME DESIGN LLP',
      date: '×6 · APR–SEP · SAME COUNTERPARTY',
      amt: '+₹45,000',
      isCredit: true,
      verdict: 'Recurring credit from a single business entity. Reads as professional income, not a personal transfer — likely reportable under 44ADA.',
      highlight: 'professional income',
      confPct: 82,
      confText: '82% · likely',
      confLow: false,
      need: 'invoice or contract',
      borderColor: null
    },
    {
      id: 'flag-2',
      txn: 'UPI DR · SHARMA P',
      date: '×12 · MONTHLY · 1ST–3RD',
      amt: '−₹18,000',
      isCredit: false,
      verdict: 'Fixed monthly debit to an individual. Consistent with rent paid — supports the HRA exemption already claimed in your return.',
      highlight: 'rent paid',
      confPct: 91,
      confText: '91% · strong',
      confLow: false,
      need: 'rent receipts + landlord PAN',
      borderColor: null
    },
    {
      id: 'flag-3',
      txn: 'IMPS CR · UNIDENTIFIED',
      date: 'ONE-TIME · 14 NOV',
      amt: '+₹1,20,000',
      isCredit: true,
      verdict: "Single large credit with no matching pattern. Could be a gift, a loan repayment, or income — Taxly can't tell from the statement alone.",
      highlight: "Taxly can't tell from the statement alone.",
      confPct: 38,
      confText: '38% · unclear',
      confLow: true,
      need: 'CA must classify',
      needLabel: 'ESCALATED — ',
      borderColor: 'rgba(224,108,117,.28)'
    }
  ]

  const [flagFilter, setFlagFilter] = useState('all') // 'all' | 'open' | 'done'
  const [flagStatuses, setFlagStatuses] = useState({}) // { [id]: 'approved' | 'rejected' }

  const handleResolveFlag = (id, resolution) => {
    setFlagStatuses((prev) => ({
      ...prev,
      [id]: resolution
    }))
  }

  const resolvedCount = Object.keys(flagStatuses).length
  const allResolved = resolvedCount === initialFlags.length
  const openCount = initialFlags.length - resolvedCount

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      {/* ══ ANNOUNCE ══ */}
      <div className="announce">
        <b>Filing season is open for AY 2025–26.</b>
        <a href="#pricing">See what it costs →</a>
      </div>

      {/* ══ NAV ══ */}
      <nav>
        <div className="nav-in">
          <Link to="/" className="brand" aria-label="Taxly Home">
            <img
              src={theme === 'light' ? '/logo-color.png' : '/logo-white.png'}
              alt="Taxly Logo"
              className="brand-logo-img"
              onError={(e) => { e.target.src = '/logo.png' }}
            />
          </Link>
          <ul className="nav-links">
            <li><a href="#how">How it works</a></li>
            <li><a href="#analyze">Statement AI</a></li>
            <li><a href="#cas">For CAs</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#engine">Tax engine</a></li>
          </ul>
          <div className="nav-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle light and dark mode"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                </svg>
              )}
            </button>
            <Link to="/login" className="btn btn-ghost">Sign in</Link>
            <button onClick={startFiling} className="btn btn-fill" disabled={loading}>
              {loading ? 'Starting...' : 'Start filing →'}
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <header className="hero">
        <div className="wrap hero-top">
          <div>
            <div className="eyebrow">Agentic tax filing · India</div>
            <h1>
              Filing isn't the hard part.
              <span className="h1-rot-line">
                <span className="h1-static">It's </span>
                <span
                  className="h1-rot"
                  id="scrambleLine"
                  ref={scrambleRef}
                  data-phrases="catching deductions.|proving claims.|flagging risks.|optimizing refunds."
                >
                  catching deductions.
                </span>
              </span>
            </h1>
          </div>
          <div className="hero-right">
            <p className="hero-sub">
              Taxly reads your Form 16, your TDS certificates and your bank statement — flags
              every rupee that needs explaining, and puts a chartered accountant on the verdict.
            </p>
            <button onClick={startFiling} className="btn btn-fill btn-lg" disabled={loading}>
              {loading ? 'Starting...' : 'Start filing free →'}
            </button>
            <p className="hero-fine" style={{ marginTop: '12px' }}>
              NO CARD REQUIRED · PAY ON DOWNLOAD
            </p>
          </div>
        </div>

        {/* ══ HERO RAIL ══ */}
        <div className="rail-shell">
          <div className={`rail ${railPaused ? 'paused' : ''}`} id="rail">
            {/* Panel 01: Interview */}
            <div
              className={`pan ${railIndex === 0 ? 'on' : ''}`}
              data-i="0"
              onClick={() => showRail(0)}
            >
              <div className="pan-head">
                <span className="pan-n">01</span>
                <span className="pan-t">Interview <em>in plain English</em></span>
                {railIndex === 0 && <span key={`p0-${progKey}`} className="pan-prog"></span>}
              </div>
              <div className="pan-body">
                <div className="pan-inner">
                  <div className="msg">
                    <div className="av bot">T</div>
                    <div className="bub bot">Your Form 16 says ₹12,40,000 gross. Do you pay rent anywhere?</div>
                  </div>
                  <div className="msg me">
                    <div className="av usr">RS</div>
                    <div className="bub me">yeah 18k a month in mumbai</div>
                  </div>
                  <div className="msg">
                    <div className="av bot">T</div>
                    <div className="bub bot">Metro city, so HRA works out to ₹84,000 exempt. I'll need rent receipts before your CA signs off.</div>
                  </div>
                  <div className="msg me">
                    <div className="av usr">RS</div>
                    <div className="bub me">i switched jobs in september too</div>
                  </div>
                  <div className="msg">
                    <div className="av bot">T</div>
                    <div className="bub bot">Then there's a second Form 16. Upload it and I'll merge both employers — that's usually where TDS goes wrong.</div>
                  </div>
                  <div className="msg">
                    <div className="av bot">T</div>
                    <div className="typing"><i></i><i></i><i></i></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 02: Ingest */}
            <div
              className={`pan ${railIndex === 1 ? 'on' : ''}`}
              data-i="1"
              onClick={() => showRail(1)}
            >
              <div className="pan-head">
                <span className="pan-n">02</span>
                <span className="pan-t">Ingest <em>every certificate</em></span>
                {railIndex === 1 && <span key={`p1-${progKey}`} className="pan-prog"></span>}
              </div>
              <div className="pan-body">
                <div className="pan-inner">
                  <div className="doc-row">
                    <div className="doc-ico">PDF</div>
                    <div className="doc-meta">
                      <div className="doc-name">form16_infosys_2025.pdf</div>
                      <div className="doc-detect">Detected <b>Form 16</b> · salary TDS · Apr–Sep</div>
                    </div>
                    <span className="pill pill-ok">PARSED</span>
                  </div>
                  <div className="doc-row">
                    <div className="doc-ico">PDF</div>
                    <div className="doc-meta">
                      <div className="doc-name">form16_razorpay_2025.pdf</div>
                      <div className="doc-detect">Detected <b>Form 16</b> · 2nd employer · Oct–Mar</div>
                    </div>
                    <span className="pill pill-ok">MERGED</span>
                  </div>
                  <div className="doc-row">
                    <div className="doc-ico">PDF</div>
                    <div className="doc-meta">
                      <div className="doc-name">hdfc_tds_q3.pdf</div>
                      <div className="doc-detect">Detected <b>Form 16A</b> · FD interest ₹42,100</div>
                    </div>
                    <span className="pill pill-ok">PARSED</span>
                  </div>
                  <div className="doc-row">
                    <div className="doc-ico">PDF</div>
                    <div className="doc-meta">
                      <div className="doc-name">zerodha_capgains_fy25.pdf</div>
                      <div className="doc-detect">Detected <b>Capital gains</b> · LTCG ₹1,82,400</div>
                    </div>
                    <span className="pill pill-ok">PARSED</span>
                  </div>
                  <div className="doc-row">
                    <div className="doc-ico">PDF</div>
                    <div className="doc-meta">
                      <div className="doc-name">scan_20260714.pdf</div>
                      <div className="doc-detect">Detected <b>Form 16C</b> · rent TDS · <span style={{ color: 'var(--amber)' }}>landlord PAN unclear</span></div>
                    </div>
                    <span className="pill pill-run">CONFIRM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 03: Analyse */}
            <div
              className={`pan ${railIndex === 2 ? 'on' : ''}`}
              data-i="2"
              onClick={() => showRail(2)}
            >
              <div className="pan-head">
                <span className="pan-n">03</span>
                <span className="pan-t">Analyse <em>the bank statement</em></span>
                {railIndex === 2 && <span key={`p2-${progKey}`} className="pan-prog"></span>}
              </div>
              <div className="pan-body">
                <div className="pan-inner">
                  <div className="flag">
                    <div className="flag-top">
                      <div>
                        <div className="flag-txn">NEFT CR · ACME DESIGN LLP</div>
                        <div className="flag-date">×6 · APR–SEP · SAME COUNTERPARTY</div>
                      </div>
                      <div className="flag-amt cr">+₹45,000</div>
                    </div>
                    <div className="flag-verdict">
                      Recurring credit from a single business entity. Reads as <b>professional income</b>, not a personal transfer.
                    </div>
                    <div className="conf">
                      <div className="conf-track"><div className="conf-fill" style={{ width: '82%' }}></div></div>
                      <span className="conf-num">82% · likely</span>
                    </div>
                    <div className="flag-foot">
                      <span className="flag-need">NEEDS <b>invoice or contract</b></span>
                      <span className="pill pill-ok">CA VERIFIED</span>
                    </div>
                  </div>

                  <div className="flag" style={{ borderColor: 'rgba(168,87,79,.26)' }}>
                    <div className="flag-top">
                      <div>
                        <div className="flag-txn">IMPS CR · UNIDENTIFIED</div>
                        <div className="flag-date">ONE-TIME · 14 NOV</div>
                      </div>
                      <div className="flag-amt cr">+₹1,20,000</div>
                    </div>
                    <div className="flag-verdict">
                      Single large credit with no matching pattern. Gift, loan repayment, or income — <b>can't tell from the statement alone.</b>
                    </div>
                    <div className="conf">
                      <div className="conf-track"><div className="conf-fill low" style={{ width: '38%' }}></div></div>
                      <span className="conf-num">38% · unclear</span>
                    </div>
                    <div className="flag-foot">
                      <span className="flag-need">ESCALATED — <b>CA must classify</b></span>
                      <span className="pill pill-warn">AWAITING CA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 04: Verify */}
            <div
              className={`pan ${railIndex === 3 ? 'on' : ''}`}
              data-i="3"
              onClick={() => showRail(3)}
            >
              <div className="pan-head">
                <span className="pan-n">04</span>
                <span className="pan-t">Verify <em>before anything files</em></span>
                {railIndex === 3 && <span key={`p3-${progKey}`} className="pan-prog"></span>}
              </div>
              <div className="pan-body">
                <div className="pan-inner">
                  <div className="qhead">
                    <span></span><span>Client</span><span>Flags</span><span>Status</span>
                  </div>
                  <div className="qrow">
                    <div className="qav">RS</div>
                    <div>
                      <div className="qname">Rahul Sharma</div>
                      <div className="qmeta">ITR-2 · 2 EMPLOYERS · LTCG</div>
                    </div>
                    <span className="qflags">1 open</span>
                    <span className="pill pill-warn">NEEDS YOU</span>
                  </div>
                  <div className="qrow">
                    <div className="qav">PN</div>
                    <div>
                      <div className="qname">Priya Nair</div>
                      <div className="qmeta">ITR-1 · SALARY · HRA</div>
                    </div>
                    <span className="qflags">0 open</span>
                    <span className="pill pill-ok">APPROVED</span>
                  </div>
                  <div className="qrow">
                    <div className="qav">AK</div>
                    <div>
                      <div className="qname">Ananya Krishnan</div>
                      <div className="qmeta">ITR-2 · NRI · DTAA (US)</div>
                    </div>
                    <span className="qflags">3 open</span>
                    <span className="pill pill-warn">NEEDS YOU</span>
                  </div>
                  <div className="qrow">
                    <div className="qav">VM</div>
                    <div>
                      <div className="qname">Vikram Mehta</div>
                      <div className="qmeta">ITR-4 · 44ADA · PRESUMPTIVE</div>
                    </div>
                    <span className="qflags">0 open</span>
                    <span className="pill pill-run">IN REVIEW</span>
                  </div>
                  <div className="qrow">
                    <div className="qav">TR</div>
                    <div>
                      <div className="qname">Tanmay Rao</div>
                      <div className="qmeta">ITR-2 · VDA · CRYPTO 30%</div>
                    </div>
                    <span className="qflags">2 open</span>
                    <span className="pill pill-warn">NEEDS YOU</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rail-ctl">
            <div className="rail-dots" id="dots">
              {[0, 1, 2, 3].map((n) => (
                <i
                  key={n}
                  className={railIndex === n ? 'on' : ''}
                  onClick={() => showRail(n)}
                />
              ))}
            </div>
            <button
              className="pausebtn"
              id="pause"
              aria-label={railPaused ? 'Play' : 'Pause'}
              onClick={() => setRailPaused((p) => !p)}
            >
              {railPaused ? '▶' : '❚❚'}
            </button>
          </div>
        </div>

        <div className="wrap">
          <div className="strip">
            <div className="strip-in">
              <div className="strip-lead">Built on a tax engine that's actually tested</div>
              <div className="strip-stats">
                <div className="sstat"><b>134</b><span>AUTOMATED TESTS</span></div>
                <div className="sstat"><b>5</b><span>TDS CERTIFICATE TYPES</span></div>
                <div className="sstat"><b>20 min</b><span>MEDIAN FILING TIME</span></div>
                <div className="sstat"><b>0</b><span>AI IN THE ARITHMETIC</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ══ PROBLEM BAND ══ */}
      <div className="band">
        <div className="wrap">
          <h2>Fast filing. <em>Slow regret.</em></h2>
          <p>
            The portal will happily accept a return that's wrong. The mistakes surface eighteen months later,
            as a notice — by which time nobody remembers what that ₹1.2 lakh credit in November actually was.
          </p>
        </div>
      </div>

      {/* ══ 01 CHAT ══ */}
      <section id="how">
        <div className="wrap feat rv">
          <div className="feat-copy">
            <div className="sec-num"><b>01</b> Interview</div>
            <h2>Questions, not <em>form fields.</em></h2>
            <p className="sec-sub">
              Nobody knows what "HRA u/s 10(13A)" means. Everybody knows whether they pay rent.
              Taxly asks the second question and derives the first.
            </p>
            <ul className="feat-points">
              <li>
                <h4>One question at a time</h4>
                <p>Branching interview that skips what doesn't apply to you — no 60-field form where 50 fields are blank.</p>
              </li>
              <li>
                <h4>Understands how people actually type</h4>
                <p>"18k a month", "two lakh fifty", "switched jobs in sept" all parse correctly.</p>
              </li>
              <li>
                <h4>Resumes where you left it</h4>
                <p>Close the tab mid-filing. Every answer is saved against your session.</p>
              </li>
            </ul>
          </div>
          <div className="feat-demo">
            <div className="demo">
              <div className="demo-bar">interview · question 7 of 12</div>
              <div className="demo-body" style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                <div className="msg">
                  <div className="av bot">T</div>
                  <div className="bub bot">Did you sell any shares or mutual funds this year?</div>
                </div>
                <div className="msg me">
                  <div className="av usr">RS</div>
                  <div className="bub me">sold some equity MFs, maybe 1.8L profit</div>
                </div>
                <div className="msg">
                  <div className="av bot">T</div>
                  <div className="bub bot">
                    That's LTCG. First ₹1,00,000 is exempt, the rest taxes at 10% — so about ₹8,000 on ₹1.8L. Were any of those units bought before 31 Jan 2018?
                  </div>
                </div>
                <div className="msg me">
                  <div className="av usr">RS</div>
                  <div className="bub me">no idea honestly</div>
                </div>
                <div className="msg">
                  <div className="av bot">T</div>
                  <div className="bub bot">
                    No problem — your broker's capital gains statement will say. Upload it and I'll apply grandfathering where it helps you.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 02 PARSE ══ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap feat flip rv">
          <div className="feat-copy">
            <div className="sec-num"><b>02</b> Ingest</div>
            <h2>Every certificate, <em>auto-detected.</em></h2>
            <p className="sec-sub">
              Drop the PDFs in. Taxly works out which form each one is and where its numbers belong —
              you never pick a document type from a dropdown.
            </p>
            <ul className="feat-points">
              <li>
                <h4>Form 16 through 16D</h4>
                <p>Salary TDS, interest and dividends, property sale, rent, contractor payments — all five certificate types.</p>
              </li>
              <li>
                <h4>Multiple employers, merged</h4>
                <p>Two Form 16s from a mid-year switch get combined, with TDS aggregated across both.</p>
              </li>
              <li>
                <h4>Honest about low confidence</h4>
                <p>When a field doesn't read cleanly it gets flagged for you to confirm — never silently guessed.</p>
              </li>
            </ul>
          </div>
          <div className="feat-demo">
            <div className="demo">
              <div className="demo-bar">documents · 4 uploaded</div>
              <div className="demo-body">
                <div className="doc-row">
                  <div className="doc-ico">PDF</div>
                  <div className="doc-meta">
                    <div className="doc-name">form16_infosys_2025.pdf</div>
                    <div className="doc-detect">Detected <b>Form 16</b> · salary TDS · Apr–Sep</div>
                  </div>
                  <span className="pill pill-ok">PARSED</span>
                </div>
                <div className="doc-row">
                  <div className="doc-ico">PDF</div>
                  <div className="doc-meta">
                    <div className="doc-name">form16_razorpay_2025.pdf</div>
                    <div className="doc-detect">Detected <b>Form 16</b> · 2nd employer · Oct–Mar</div>
                  </div>
                  <span className="pill pill-ok">MERGED</span>
                </div>
                <div className="doc-row">
                  <div className="doc-ico">PDF</div>
                  <div className="doc-meta">
                    <div className="doc-name">hdfc_tds_q3.pdf</div>
                    <div className="doc-detect">Detected <b>Form 16A</b> · FD interest ₹42,100</div>
                  </div>
                  <span className="pill pill-ok">PARSED</span>
                </div>
                <div className="doc-row">
                  <div className="doc-ico">PDF</div>
                  <div className="doc-meta">
                    <div className="doc-name">scan_20260714.pdf</div>
                    <div className="doc-detect">Detected <b>Form 16C</b> · rent TDS · <span style={{ color: 'var(--amber)' }}>landlord PAN unclear</span></div>
                  </div>
                  <span className="pill pill-run">CONFIRM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 03 ANALYZE — signature ══ */}
      <section id="analyze" style={{ paddingTop: 0 }}>
        <div className="wrap feat rv">
          <div className="feat-copy">
            <div className="sec-num"><b>03</b> Analyse</div>
            <h2>The part your <em>Form 16 can't tell you.</em></h2>
            <p className="sec-sub">
              Salary is the easy half. Taxly reads your bank statement line by line and surfaces the
              credits that need explaining — with a confidence score and the exact document required to prove it.
            </p>
            <ul className="feat-points">
              <li>
                <h4>Flags, never claims</h4>
                <p>Taxly proposes. It does not file a single deduction without a human verifying the proof behind it.</p>
              </li>
              <li>
                <h4>Separates income from transfers</h4>
                <p>A recurring credit from one counterparty reads very differently to money moved between your own accounts.</p>
              </li>
              <li>
                <h4>Tells you what it can't tell</h4>
                <p>Low-confidence items get escalated to your CA rather than assumed in either direction.</p>
              </li>
            </ul>
          </div>
          <div className="feat-demo">
            <div className="demo">
              <div className="demo-bar">
                statement analysis · 1,284 transactions · <span id="flagCount">{openCount}</span> flagged
              </div>
              <div className="demo-body">
                <div className="triage-tabs">
                  <button
                    className={`ttab ${flagFilter === 'all' ? 'on' : ''}`}
                    onClick={() => setFlagFilter('all')}
                  >
                    ALL · {initialFlags.length}
                  </button>
                  <button
                    className={`ttab ${flagFilter === 'open' ? 'on' : ''}`}
                    onClick={() => setFlagFilter('open')}
                  >
                    OPEN {openCount > 0 ? `· ${openCount}` : ''}
                  </button>
                  <button
                    className={`ttab ${flagFilter === 'done' ? 'on' : ''}`}
                    onClick={() => setFlagFilter('done')}
                  >
                    RESOLVED {resolvedCount > 0 ? `· ${resolvedCount}` : ''}
                  </button>
                </div>

                {initialFlags.map((fl) => {
                  const isResolved = !!flagStatuses[fl.id]
                  if (flagFilter === 'open' && isResolved) return null
                  if (flagFilter === 'done' && !isResolved) return null

                  const res = flagStatuses[fl.id]

                  return (
                    <div
                      key={fl.id}
                      className={`flag ${isResolved ? 'resolved' : ''}`}
                      style={fl.borderColor ? { borderColor: fl.borderColor } : {}}
                    >
                      <div className="flag-top">
                        <div>
                          <div className="flag-txn">{fl.txn}</div>
                          <div className="flag-date">{fl.date}</div>
                        </div>
                        <div className={`flag-amt ${fl.isCredit ? 'cr' : ''}`}>{fl.amt}</div>
                      </div>
                      <div className="flag-verdict">
                        {fl.verdict.split(fl.highlight)[0]}
                        <b>{fl.highlight}</b>
                        {fl.verdict.split(fl.highlight)[1]}
                      </div>
                      <div className="conf">
                        <div className="conf-track">
                          <div className={`conf-fill ${fl.confLow ? 'low' : ''}`} style={{ width: `${fl.confPct}%` }}></div>
                        </div>
                        <span className="conf-num">{fl.confText}</span>
                      </div>
                      <div className="flag-foot">
                        <span className="flag-need">
                          {fl.needLabel || 'NEEDS '}
                          <b>{fl.need}</b>
                        </span>
                        <div className="act">
                          {isResolved ? (
                            <span className={`pill ${res === 'approved' ? 'pill-ok' : 'pill-warn'}`}>
                              {res === 'approved' ? 'CA APPROVED ✓' : 'REJECTED — EXCLUDED'}
                            </span>
                          ) : (
                            <>
                              <button className="ok" onClick={() => handleResolveFlag(fl.id, 'approved')}>
                                APPROVE
                              </button>
                              <button className="no" onClick={() => handleResolveFlag(fl.id, 'rejected')}>
                                REJECT
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="disclaim">
                  <b>Taxly flags and suggests. It never files.</b> Every item above enters your return only
                  after a chartered accountant checks it against the document behind it.
                </div>
                <div className="triage-sum">
                  <span>TRY IT — RESOLVE A FLAG</span>
                  <span>
                    <b id="resolvedN">{resolvedCount}</b> OF {initialFlags.length} RESOLVED ·{' '}
                    <span id="gateMsg" style={allResolved ? { color: 'var(--green-light)' } : {}}>
                      {allResolved ? 'XML UNLOCKED ✓' : 'XML LOCKED'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 04 VERIFY ══ */}
      <section id="cas" style={{ paddingTop: 0 }}>
        <div className="wrap feat flip rv">
          <div className="feat-copy">
            <div className="sec-num"><b>04</b> Verify</div>
            <h2>A CA signs it. <em>Not a checkbox.</em></h2>
            <p className="sec-sub">
              Your return reaches a chartered accountant with the data entry already done and the
              questionable items already isolated — so their time goes into judgement, not typing.
            </p>
            <ul className="feat-points">
              <li>
                <h4>A queue, not a PDF</h4>
                <p>CAs work a structured list of flagged items with confidence and evidence attached to each one.</p>
              </li>
              <li>
                <h4>Approve, reject, or ask</h4>
                <p>Every flag resolves to a decision. Unresolved items block the filing from being released.</p>
              </li>
              <li>
                <h4>XML unlocks on sign-off</h4>
                <p>Nothing is downloadable until a real person has put their name against it.</p>
              </li>
            </ul>
          </div>
          <div className="feat-demo">
            <div className="demo">
              <div className="demo-bar">ca portal · review queue · 9 clients</div>
              <div className="demo-body" style={{ padding: '14px 4px 6px' }}>
                <div className="qhead">
                  <span></span><span>Client</span><span>Flags</span><span>Status</span>
                </div>
                <div className="qrow">
                  <div className="qav">RS</div>
                  <div>
                    <div className="qname">Rahul Sharma</div>
                    <div className="qmeta">ITR-2 · 2 EMPLOYERS · LTCG</div>
                  </div>
                  <span className="qflags">1 open</span>
                  <span className="pill pill-warn">NEEDS YOU</span>
                </div>
                <div className="qrow">
                  <div className="qav">PN</div>
                  <div>
                    <div className="qname">Priya Nair</div>
                    <div className="qmeta">ITR-1 · SALARY · HRA</div>
                  </div>
                  <span className="qflags">0 open</span>
                  <span className="pill pill-ok">APPROVED</span>
                </div>
                <div className="qrow">
                  <div className="qav">AK</div>
                  <div>
                    <div className="qname">Ananya Krishnan</div>
                    <div className="qmeta">ITR-2 · NRI · DTAA (US)</div>
                  </div>
                  <span className="qflags">3 open</span>
                  <span className="pill pill-warn">NEEDS YOU</span>
                </div>
                <div className="qrow">
                  <div className="qav">VM</div>
                  <div>
                    <div className="qname">Vikram Mehta</div>
                    <div className="qmeta">ITR-4 · 44ADA · PRESUMPTIVE</div>
                  </div>
                  <span className="qflags">0 open</span>
                  <span className="pill pill-run">IN REVIEW</span>
                </div>
                <div className="qrow">
                  <div className="qav">SD</div>
                  <div>
                    <div className="qname">Sneha Deshpande</div>
                    <div className="qmeta">ITR-1 · SALARY ONLY</div>
                  </div>
                  <span className="qflags">—</span>
                  <span className="pill pill-idle">FILING</span>
                </div>
                <div className="qrow">
                  <div className="qav">TR</div>
                  <div>
                    <div className="qname">Tanmay Rao</div>
                    <div className="qmeta">ITR-2 · VDA · CRYPTO 30%</div>
                  </div>
                  <span className="qflags">2 open</span>
                  <span className="pill pill-warn">NEEDS YOU</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SCROLL-PINNED CONTEXT ══ */}
      <section className="ctx" id="context" style={{ padding: 0 }}>
        <div className="wrap ctx-head rv">
          <div className="sec-num"><b>Context</b> Shared intelligence</div>
          <h2>Every source, <em>one return.</em></h2>
          <p className="sec-sub">
            A Form 16 shows what one employer paid you. Your return has to account for everything else too —
            Taxly pulls each source in and reconciles them against one another.
          </p>
        </div>

        <div className="wrap ctx-stage">
          <div className="ctx-list" id="ctxList" ref={ctxListRef}>
            <div className="ctx-rail"></div>
            <div className="ctx-rail-fill" id="railFill" ref={railFillRef}></div>

            {ctxItems.map((it, idx) => (
              <div
                key={it.id}
                className={`ctx-item ${activeCtx === idx ? 'on' : ''}`}
                data-node={it.id}
                onClick={() => selectCtx(idx)}
              >
                <h4>{it.title}</h4>
                <p>{it.desc}</p>
              </div>
            ))}
          </div>

          <div className="ctx-visual">
            <div className="ctx-orb">
              <svg className="ctx-svg" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="ctx-core-ring" cx="210" cy="210" r="150" />
                <circle className="ctx-core-ring" cx="210" cy="210" r="118" style={{ animationDirection: 'reverse', animationDuration: '44s' }} />

                {/* Edges */}
                <line className={`edge ${activeCtx === 0 ? 'on' : ''}`} data-edge="n1" x1="210" y1="210" x2="210" y2="72" />
                <line className={`edge ${activeCtx === 1 ? 'on' : ''}`} data-edge="n2" x1="210" y1="210" x2="330" y2="141" />
                <line className={`edge ${activeCtx === 2 ? 'on' : ''}`} data-edge="n3" x1="210" y1="210" x2="330" y2="279" />
                <line className={`edge ${activeCtx === 3 ? 'on' : ''}`} data-edge="n4" x1="210" y1="210" x2="210" y2="348" />
                <line className={`edge ${activeCtx === 4 ? 'on' : ''}`} data-edge="n5" x1="210" y1="210" x2="90" y2="279" />
                <line className={`edge ${activeCtx === 5 ? 'on' : ''}`} data-edge="n6" x1="210" y1="210" x2="90" y2="141" />

                {/* Core */}
                <circle cx="210" cy="210" r="30" fill="rgba(91,158,126,.1)" stroke="rgba(91,158,126,.35)" />
                <text x="210" y="207" textAnchor="middle" style={{ fontFamily: 'Inter Tight', fontSize: '14px', fontWeight: 600, fill: '#7DBFA0' }}>
                  T
                </text>
                <text x="210" y="221" textAnchor="middle" style={{ fontFamily: 'var(--mono)', fontSize: '6.5px', fill: 'rgba(255,255,255,.35)', letterSpacing: '.08em' }}>
                  RETURN
                </text>

                {/* Nodes */}
                <g className={`node ${activeCtx === 0 ? 'on' : ''}`} data-node="n1">
                  <circle cx="210" cy="72" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="210" y="56" textAnchor="middle">FORM 16</text>
                </g>
                <g className={`node ${activeCtx === 1 ? 'on' : ''}`} data-node="n2">
                  <circle cx="330" cy="141" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="330" y="125" textAnchor="middle">STATEMENT</text>
                </g>
                <g className={`node ${activeCtx === 2 ? 'on' : ''}`} data-node="n3">
                  <circle cx="330" cy="279" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="330" y="301" textAnchor="middle">CAP GAINS</text>
                </g>
                <g className={`node ${activeCtx === 3 ? 'on' : ''}`} data-node="n4">
                  <circle cx="210" cy="348" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="210" y="370" textAnchor="middle">ANSWERS</text>
                </g>
                <g className={`node ${activeCtx === 4 ? 'on' : ''}`} data-node="n5">
                  <circle cx="90" cy="279" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="90" y="301" textAnchor="middle">ENGINE</text>
                </g>
                <g className={`node ${activeCtx === 5 ? 'on' : ''}`} data-node="n6">
                  <circle cx="90" cy="141" r="5.5" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.22)" />
                  <text x="90" y="125" textAnchor="middle">CA</text>
                </g>
              </svg>

              <div className="ctx-readout">
                <span>SOURCE · <b id="ctxName">{ctxItems[activeCtx].title}</b></span>
                <span><b id="ctxCount">{activeCtx + 1}</b> / 6 RECONCILED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ENGINE ══ */}
      <section id="engine" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Engine</b> The arithmetic</div>
            <h2>AI reads. <em>Code calculates.</em></h2>
            <p className="sec-sub">
              The language model handles the conversation and the document parsing. Not one rupee of your
              liability is computed by a model — that's deterministic Python, covered by 134 tests.
            </p>
          </div>
          <div className="eng rv">
            <div className="eng-c">
              <span className="tick">ITR-1 · ITR-2</span>
              <h4>Salary and capital gains</h4>
              <p>Multiple employers, HRA across metro rules, LTCG with Jan-2018 grandfathering, STCG, debt funds with indexation.</p>
            </div>
            <div className="eng-c">
              <span className="tick">ITR-3 · ITR-4</span>
              <h4>Business and professional</h4>
              <p>Presumptive taxation under 44AD, 44ADA and 44AE, with the turnover thresholds applied correctly.</p>
            </div>
            <div className="eng-c">
              <span className="tick">RESIDENCY</span>
              <h4>NRI and RNOR</h4>
              <p>DTAA relief across six treaty countries, the 20% special rate under 115E, and RNOR foreign-income exemption.</p>
            </div>
            <div className="eng-c">
              <span className="tick">CHAPTER VI-A</span>
              <h4>Twenty-plus deductions</h4>
              <p>80C through 80U including 80EE/80EEA exclusivity, 80GG when HRA doesn't apply, and 80DDB age bands.</p>
            </div>
            <div className="eng-c">
              <span className="tick">EDGE CASES</span>
              <h4>Where returns actually break</h4>
              <p>Surcharge with marginal relief, AMT above ₹20L, agricultural partial integration, Section 89 arrears relief.</p>
            </div>
            <div className="eng-c">
              <span className="tick">NEWER HEADS</span>
              <h4>Crypto and gaming</h4>
              <p>VDA at a flat 30% with no set-off, and online gaming winnings under 115BBJ with TDS credited.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ LIVE CALCULATOR ══ */}
      <section id="calculator" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Estimate</b> Before you sign up</div>
            <h2>Which regime is <em>actually cheaper?</em></h2>
            <p className="sec-sub">
              Drag the numbers. This runs the same slab logic the real engine does — simplified, but honest about it.
            </p>
          </div>

          <div className="calc-wrap rv">
            <div className="calc-in">
              <div className="fld">
                <div className="fld-top">
                  <span className="fld-lab">Gross annual salary</span>
                  <span className="fld-val" id="salVal">{fmt(sal)}</span>
                </div>
                <input
                  type="range"
                  id="sal"
                  min="300000"
                  max="5000000"
                  step="10000"
                  value={sal}
                  onChange={(e) => setSal(+e.target.value)}
                />
                <div className="fld-hint"><span>₹3L</span><span>₹50L</span></div>
              </div>

              <div className="fld">
                <div className="fld-top">
                  <span className="fld-lab">80C investments · ELSS, PPF, EPF</span>
                  <span className="fld-val" id="c80Val">{fmt(c80)}</span>
                </div>
                <input
                  type="range"
                  id="c80"
                  min="0"
                  max="150000"
                  step="5000"
                  value={c80}
                  onChange={(e) => setC80(+e.target.value)}
                />
                <div className="fld-hint"><span>₹0</span><span>₹1.5L cap</span></div>
              </div>

              <div className="fld">
                <div className="fld-top">
                  <span className="fld-lab">Annual rent paid</span>
                  <span className="fld-val" id="rentVal">{fmt(rent)}</span>
                </div>
                <input
                  type="range"
                  id="rent"
                  min="0"
                  max="600000"
                  step="6000"
                  value={rent}
                  onChange={(e) => setRent(+e.target.value)}
                />
                <div className="fld-hint"><span>₹0</span><span>₹6L</span></div>
              </div>

              <div className="fld">
                <div className="fld-top">
                  <span className="fld-lab">80D · health insurance</span>
                  <span className="fld-val" id="d80Val">{fmt(d80)}</span>
                </div>
                <input
                  type="range"
                  id="d80"
                  min="0"
                  max="100000"
                  step="5000"
                  value={d80}
                  onChange={(e) => setD80(+e.target.value)}
                />
                <div className="fld-hint"><span>₹0</span><span>₹1L</span></div>
              </div>
            </div>

            <div className="calc-out">
              <div className="vs">
                <div className={`vs-card ${oldWins ? 'win' : ''}`} id="oldCard">
                  <div className="vs-lab">OLD REGIME</div>
                  <div className="vs-amt count" id="oldAmt">{fmt(oldTax)}</div>
                  <span className="vs-tag">CHEAPER</span>
                </div>
                <div className={`vs-card ${!oldWins ? 'win' : ''}`} id="newCard">
                  <div className="vs-lab">NEW REGIME</div>
                  <div className="vs-amt count" id="newAmt">{fmt(newTax)}</div>
                  <span className="vs-tag">CHEAPER</span>
                </div>
              </div>

              <div className="save-box">
                <div className="save-lab">YOU'D SAVE BY PICKING RIGHT</div>
                <div className="save-amt count" id="saveAmt">{fmt(gap)}</div>
                <p className="save-note" id="saveNote">{saveNote}</p>
              </div>

              <p className="calc-fine">
                Slab rates, standard deduction and 87A rebate only. The real engine also handles HRA metro rules,
                surcharge with marginal relief, capital gains, AMT and twenty-plus other deductions — which is
                why your actual number will differ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Pricing</b> Per filing year</div>
            <h2>Pay for judgement, <em>not data entry.</em></h2>
            <p className="sec-sub">
              The cheap tier is genuinely cheap because it's genuinely automated. The expensive tier costs
              more because a chartered accountant actually spends time on it.
            </p>
          </div>
          <div className="tiers rv">
            <div className="tier">
              <div className="tier-tag">Self-file</div>
              <div className="tier-price">₹199<small>/ YEAR</small></div>
              <p className="tier-for">One employer, salary income, standard deductions. No human involved — and we don't pretend otherwise.</p>
              <ul>
                <li>Conversational interview</li>
                <li>Form 16 auto-parsing</li>
                <li>ITR-1 and ITR-2</li>
                <li>Old vs new regime comparison</li>
                <li>ITR XML download</li>
              </ul>
              <button onClick={startFiling} className="btn btn-line" disabled={loading}>
                Start self-filing
              </button>
            </div>

            <div className="tier hot">
              <span className="tier-badge">Most filed</span>
              <div className="tier-tag">AI + CA verified</div>
              <div className="tier-price">₹999<small>/ YEAR</small></div>
              <p className="tier-for">Bank statement analysed, every flag checked against real evidence by a chartered accountant.</p>
              <ul>
                <li>Everything in Self-file</li>
                <li>All five TDS certificate types</li>
                <li>Bank statement AI analysis</li>
                <li>Deduction flags with required proof</li>
                <li>CA verifies every flagged item</li>
                <li>Multiple Form 16s and NRI returns</li>
              </ul>
              <button onClick={startFiling} className="btn btn-fill" disabled={loading}>
                Get CA verification
              </button>
            </div>

            <div className="tier">
              <div className="tier-tag">Full advisory</div>
              <div className="tier-price">₹1,999<small>/ YEAR</small></div>
              <p className="tier-for">Business receipts through personal accounts, property sales, or planning that spans years.</p>
              <ul>
                <li>Everything in AI + CA verified</li>
                <li>Direct CA consultation</li>
                <li>Multi-year regime planning</li>
                <li>Notice-risk review</li>
                <li>ITR-3 and ITR-4 business income</li>
              </ul>
              <Link to="/pricing" className="btn btn-line">
                Talk to a CA
              </Link>
            </div>
          </div>
          <p className="tier-note">
            A CA firm charges ₹2,000–15,000 for the same return · ClearTax charges ₹499 with no review at all
          </p>
        </div>
      </section>

      {/* ══ OUTCOMES ══ */}
      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Why</b> It's built this way</div>
            <h2>Where returns <em>actually go wrong.</em></h2>
          </div>
          <div className="outs rv">
            <div className="out">
              <b>2</b>
              <span>Form 16s after a mid-year job switch — the single most common cause of mismatched TDS</span>
            </div>
            <div className="out">
              <b>₹1L</b>
              <span>LTCG exemption people forget exists, then overpay on equity gains</span>
            </div>
            <div className="out">
              <b>18mo</b>
              <span>Typical lag before an unexplained credit comes back as a notice</span>
            </div>
            <div className="out">
              <b>30%</b>
              <span>Flat rate on crypto with no set-off — routinely filed wrong</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <div className="cta">
        <div className="wrap cta-in">
          <h2>Start with the interview.<br />Pay when you <em>download.</em></h2>
          <p>20 MINUTES · NO CARD UPFRONT · CA-VERIFIED FROM ₹999</p>
          <button onClick={startFiling} className="btn btn-fill btn-lg" disabled={loading}>
            {loading ? 'Starting...' : 'Start filing free →'}
          </button>
        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer>
        <div className="wrap">
          <div className="f-grid">
            <div className="f-brand">
              <Link to="/" aria-label="Taxly Home">
                <img
                  src={theme === 'light' ? '/logo-color.png' : '/logo-white.png'}
                  alt="Taxly Logo"
                  className="footer-logo-img"
                  onError={(e) => { e.target.src = '/logo.png' }}
                />
              </Link>
              <p>Conversational ITR filing for India, with a chartered accountant on every verdict that matters.</p>
            </div>
            <div className="f-col">
              <h5>Product</h5>
              <a href="#how">How it works</a>
              <a href="#analyze">Statement analysis</a>
              <a href="#engine">Tax engine</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="f-col">
              <h5>For CAs</h5>
              <Link to="/ca/login">CA portal</Link>
              <Link to="/for-cas/apply">Apply as a partner</Link>
              <Link to="/pricing">Practice pricing</Link>
            </div>
            <div className="f-col">
              <h5>Legal</h5>
              <Link to="/privacy-policy">Privacy policy</Link>
              <Link to="/terms-and-conditions">Terms of use</Link>
              <Link to="/refund-policy">Refund policy</Link>
              <Link to="/grievance">Grievance officer</Link>
            </div>
          </div>

          <p className="f-legal">
            Taxly prepares your return and generates the ITR XML. You submit and e-verify it on the income tax
            portal yourself. The self-file tier is automated tax preparation and does not constitute tax advice.
            Statement analysis surfaces items for a chartered accountant to verify — it is not a determination of
            taxability on its own.
          </p>

          <div className="f-base">
            <span>© 2026 TAXLY · MADE IN INDIA</span>
            <span>GRIEVANCE OFFICER · GRIEVANCE@TAXLY.IN · 15-DAY RESPONSE PER IT RULES 2021</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
