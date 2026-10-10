import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'
import TaxConstellationOrb from '../components/TaxConstellationOrb'
import { TAX_YEAR_CONFIG } from '../config/taxYear'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme')
      if (p === 'light' || p === 'dark') return p
      const saved = localStorage.getItem('taxly_theme')
      if (saved) return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('taxly_theme', nextTheme)
  }, [theme])

  // ── Session start / Start filing ─────────────────────────────────────────────
  const startFiling = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault()
    navigate('/dashboard')
  }, [navigate])

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
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    document.body.style.backgroundColor = 'var(--bg)'
    document.body.style.color = 'var(--text)'
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

  // ── 2. Per-character rolling wave headline rotator ────────────────────────
  const rollRef = useRef(null)
  const rollSrRef = useRef(null)

  useEffect(() => {
    const root = rollRef.current
    const sr = rollSrRef.current
    if (!root || !sr) return

    const PHRASES = [
      'reading it.',
      'catching deductions.',
      'matching your TDS.',
      'flagging mismatches.',
      'proving HRA claims.',
      'picking the regime.',
      'verifying the verdict.',
      'getting CA sign-off.'
    ]
    const STAGGER = 12
    const DUR = 210
    const PERIOD = 2500
    const EASE = 'cubic-bezier(.25,1,.5,1)'

    // Taxly brand animation colors: signature emerald green and bright cyan-teal (no orange)
    const UP = '#5BD68A'
    const DOWN = '#2DD4BF'
    const getTargetColor = () => (theme === 'light' ? '#0E1A2E' : '#FFFFFF')

    if (reduceMotion) {
      sr.textContent = PHRASES[0]
      root.textContent = ''
      for (let i = 0; i < PHRASES[0].length; i++) {
        const c = document.createElement('span')
        c.className = 'roll-cell'
        c.setAttribute('aria-hidden', 'true')
        const g = document.createElement('span')
        g.className = 'roll-g'
        g.textContent = PHRASES[0][i]
        c.appendChild(g)
        root.appendChild(c)
      }
      return
    }

    // Hidden probe element used to measure character widths accurately
    // Attached to root's parent container so it inherits font-family, font-size, font-weight, letter-spacing
    const probe = document.createElement('span')
    probe.setAttribute('aria-hidden', 'true')
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0;pointer-events:none;'
    const parentContainer = root.parentElement || document.body
    parentContainer.appendChild(probe)

    const wcache = {}
    function widthEm(ch) {
      if (ch === '') return 0
      if (wcache[ch] != null) return wcache[ch]
      const cs = window.getComputedStyle(root)
      probe.style.fontFamily = cs.fontFamily
      probe.style.fontSize = cs.fontSize
      probe.style.fontWeight = cs.fontWeight
      probe.style.fontStyle = cs.fontStyle
      probe.style.letterSpacing = cs.letterSpacing
      probe.textContent = ch
      const fs = parseFloat(cs.fontSize) || 16
      const rectWidth = probe.getBoundingClientRect().width
      const em = rectWidth / fs
      // Safety fallback to prevent 0 or collapsed width
      const safeEm = em > 0.05 ? em : (ch === ' ' ? 0.32 : 0.55)
      return (wcache[ch] = safeEm)
    }

    function makeGlyph(ch, cls) {
      const s = document.createElement('span')
      s.className = 'roll-g ' + cls
      s.textContent = ch
      return s
    }

    let current = PHRASES[0]

    function swap(to) {
      const from = current
      const N = Math.max(from.length, to.length)
      const anims = []
      const white = getTargetColor()
      root.textContent = ''

      for (let i = 0; i < N; i++) {
        const oc = from[i] || ''
        const nc = to[i] || ''
        const cell = document.createElement('span')
        cell.className = 'roll-cell'
        cell.setAttribute('aria-hidden', 'true')
        cell.style.width = widthEm(oc) + 'em'

        const o = makeGlyph(oc, 'old')
        const n = makeGlyph(nc, 'new')
        cell.appendChild(o)
        cell.appendChild(n)
        root.appendChild(cell)

        const down = (i % 3 === 1)
        const tint = down ? DOWN : UP
        const delay = i * STAGGER
        const base = { duration: DUR, delay, fill: 'both' }

        anims.push(o.animate(
          [{ transform: 'translateY(0)' }, { transform: `translateY(${down ? '100%' : '-100%'})` }],
          { ...base, easing: EASE }
        ))
        anims.push(n.animate(
          [{ transform: `translateY(${down ? '-100%' : '100%'})` }, { transform: 'translateY(0)' }],
          { ...base, easing: EASE }
        ))
        anims.push(n.animate(
          [{ color: tint }, { color: white }],
          { ...base, easing: 'linear' }
        ))
        anims.push(cell.animate(
          [{ width: widthEm(oc) + 'em' }, { width: widthEm(nc) + 'em' }],
          { ...base, easing: EASE }
        ))
      }

      current = to
      sr.textContent = to

      Promise.all(anims.map(a => a.finished)).then(() => {
        root.querySelectorAll('.roll-cell').forEach((c, i) => {
          const old = c.querySelector('.old')
          if (old) old.remove()
          c.style.width = widthEm(to[i] || '') + 'em'
        })
        anims.forEach(a => { try { a.cancel() } catch (e) {} })
      }).catch(() => {})
    }

    function init() {
      root.textContent = ''
      for (let i = 0; i < current.length; i++) {
        const c = document.createElement('span')
        c.className = 'roll-cell'
        c.setAttribute('aria-hidden', 'true')
        c.style.width = widthEm(current[i]) + 'em'
        c.appendChild(makeGlyph(current[i], 'new'))
        root.appendChild(c)
      }
      sr.textContent = current
    }

    let idx = 0
    let intervalId = null
    let initTimeout = null

    const tick = () => {
      if (document.hidden) return
      idx = (idx + 1) % PHRASES.length
      swap(PHRASES[idx])
    }

    init()

    const onResize = () => {
      for (const k in wcache) delete wcache[k]
      root.querySelectorAll('.roll-cell').forEach((c, i) => {
        c.style.width = widthEm(current[i] || '') + 'em'
      })
    }
    window.addEventListener('resize', onResize)

    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
    ready.then(() => {
      for (const k in wcache) delete wcache[k]
      root.querySelectorAll('.roll-cell').forEach((c, i) => {
        c.style.width = widthEm(current[i] || '') + 'em'
      })
      initTimeout = setTimeout(() => {
        tick()
        intervalId = setInterval(tick, PERIOD)
      }, 900)
    })

    return () => {
      clearTimeout(initTimeout)
      clearInterval(intervalId)
      window.removeEventListener('resize', onResize)
      if (probe.parentNode) probe.parentNode.removeChild(probe)
    }
  }, [reduceMotion, theme])

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

  const [activePersona, setActivePersona] = useState('Salaried')
  const [showSampleModal, setShowSampleModal] = useState(false)
  const highlightTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!showSampleModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowSampleModal(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSampleModal])

  const handlePersonaSelect = (persona) => {
    setActivePersona(persona)

    if (persona === 'Salaried') {
      const el = document.getElementById('how')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      return
    }

    const engineEl = document.getElementById('engine')
    if (engineEl) {
      engineEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }
    document.querySelectorAll('.eng-c.eng-c-flash').forEach((card) => {
      card.classList.remove('eng-c-flash')
    })

    const tickMap = {
      'Capital gains': 'ITR-1 · ITR-2',
      'Freelancer': 'ITR-3 · ITR-4',
      'NRI': 'RESIDENCY',
      'Crypto': 'NEWER HEADS',
    }

    const tickTarget = tickMap[persona]
    if (!tickTarget) return

    const cards = document.querySelectorAll('#engine .eng-c')
    let targetCard = null
    cards.forEach((card) => {
      const tick = card.querySelector('.tick')
      if (tick && tick.textContent.trim().includes(tickTarget)) {
        targetCard = card
      }
    })

    if (targetCard) {
      targetCard.classList.add('eng-c-flash')
      highlightTimerRef.current = setTimeout(() => {
        targetCard.classList.remove('eng-c-flash')
      }, 1500)
    }
  }

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      {/* ══ ANNOUNCE ══ */}
      <div className="announce">
        <b>{TAX_YEAR_CONFIG.announcementText}</b>
        <a href="#pricing">{TAX_YEAR_CONFIG.announcementCta}</a>
      </div>

      {/* ══ NAV ══ */}
      <SiteNav
        theme={theme}
        toggleTheme={toggleTheme}
        startFiling={startFiling}
        loading={loading}
      />

      {/* ══ HERO ══ */}
      <header className="hero">
        <div className="wrap hero-top">
          <div>
            <div className="eyebrow">Agentic tax filing · India</div>
            <h1>
              Filing isn't the hard part.
              <span className="h1-rot-line">
                <span className="h1-static">It's </span>
                <span className="h1-rot" aria-live="polite">
                  <span ref={rollRef} className="roll" aria-hidden="true" />
                  <span ref={rollSrRef} className="sr-only" />
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
              {loading ? 'Starting...' : 'Start a free trial →'}
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

                  <a
                    href="#sample-output"
                    className="sample-link"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowSampleModal(true)
                    }}
                  >
                    Don't have your documents handy? See a sample output →
                  </a>
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

        {/* ══ PERSONA STRIP ══ */}
        <div className="wrap persona-strip rv">
          <span className="persona-label">I am</span>
          <div className="persona-tabs">
            <button
              className={`ptab ${activePersona === 'Salaried' ? 'ptab-active on' : ''}`}
              onClick={() => handlePersonaSelect('Salaried')}
            >
              Salaried
            </button>
            <button
              className={`ptab ${activePersona === 'Capital gains' ? 'ptab-active on' : ''}`}
              onClick={() => handlePersonaSelect('Capital gains')}
            >
              Capital gains
            </button>
            <button
              className={`ptab ${activePersona === 'Freelancer' ? 'ptab-active on' : ''}`}
              onClick={() => handlePersonaSelect('Freelancer')}
            >
              Freelancer
            </button>
            <button
              className={`ptab ${activePersona === 'NRI' ? 'ptab-active on' : ''}`}
              onClick={() => handlePersonaSelect('NRI')}
            >
              NRI
            </button>
            <button
              className={`ptab ${activePersona === 'Crypto' ? 'ptab-active on' : ''}`}
              onClick={() => handlePersonaSelect('Crypto')}
            >
              Crypto
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
          <div className="sec-tag" style={{ color: '#10B981', letterSpacing: '0.08em', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            SHARED INTELLIGENCE
          </div>
          <h2>Best-in-class context. <em>Every source, one return.</em></h2>
          <p className="sec-sub">
            Across each step, Taxly ingests, normalizes, and reconciles dozens more data points than traditional tools —
            guaranteeing zero missed exemptions and zero arithmetic discrepancies.
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
            <TaxConstellationOrb activeIdx={activeCtx} />
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
            {loading ? 'Starting...' : 'Start a free trial →'}
          </button>
        </div>
      </div>

      {/* ══ TRUST ══ */}
      <section id="trust" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Trust</b> How we handle your data</div>
            <h2>Your PAN is not <em>our product.</em></h2>
          </div>
          <div className="trust-grid rv">
            <div className="eng-c">
              <span className="tick">STORAGE</span>
              <h4>Encrypted at rest</h4>
              <p>
                Your documents and filing data are stored in Supabase with row-level
                security — accessible only to your account and the CA assigned to your
                filing.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">USAGE</span>
              <h4>Never sold, never shared</h4>
              <p>
                Your data is used exclusively to prepare your ITR. We don't sell it,
                rent it, or use it for anything beyond the filing you asked for.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">AI SCOPE</span>
              <h4>AI reads. It doesn't decide.</h4>
              <p>
                Language models handle conversation and document parsing. Every number
                in your return comes from deterministic code, and every flagged deduction
                is checked by a human before it's accepted.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">ACCOUNTABILITY</span>
              <h4>Mistakes are on us</h4>
              <p>
                If our calculation engine causes a defect notice, we file your revised
                return at no cost and cover any interest directly caused by our error.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <SiteFooter theme={theme} />

      {/* ══ SAMPLE OUTPUT MODAL ══ */}
      {showSampleModal && (
        <div
          className="sample-modal-overlay"
          onClick={() => setShowSampleModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="demo sample-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="demo-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="pill pill-idle">SAMPLE — not your data</span>
              </div>
              <button
                className="sample-modal-close"
                onClick={() => setShowSampleModal(false)}
                aria-label="Close sample modal"
              >
                ×
              </button>
            </div>
            <div className="demo-body sample-modal-body">
              <div className="sample-summary-head">
                <h3>Tax Summary</h3>
                <p>AY 2025–26 · Form 16 & deductions reconciled</p>
              </div>
              <div className="sample-breakdown-list">
                <div className="sample-breakdown-row">
                  <span>Gross salary</span>
                  <span className="amt">₹18,40,000</span>
                </div>
                <div className="sample-breakdown-row">
                  <span>Standard deduction</span>
                  <span className="amt neg">–₹75,000</span>
                </div>
                <div className="sample-breakdown-row">
                  <span>80C deductions</span>
                  <span className="amt neg">–₹1,50,000</span>
                </div>
                <div className="sample-breakdown-row">
                  <span>HRA exemption</span>
                  <span className="amt neg">–₹1,84,000</span>
                </div>
                <div className="sample-breakdown-row subtotal">
                  <span>Net taxable income</span>
                  <span className="amt">₹14,31,000</span>
                </div>
                <div className="sample-breakdown-row">
                  <span>Tax payable</span>
                  <span className="amt">₹1,54,200</span>
                </div>
                <div className="sample-breakdown-row">
                  <span>TDS already paid</span>
                  <span className="amt neg">–₹1,82,400</span>
                </div>
                <div className="sample-breakdown-row final-row">
                  <span>Refund due</span>
                  <span className="amt refund">₹28,200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
