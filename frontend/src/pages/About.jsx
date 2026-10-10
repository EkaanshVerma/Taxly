import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import './Home.css'

export default function About() {
  const location = useLocation()
  const highlightTimerRef = useRef(null)
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

  // Reduced motion detection
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    document.body.style.backgroundColor = 'var(--bg)'
    document.body.style.color = 'var(--text)'
  }, [theme])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('taxly_theme', nextTheme)
  }, [theme])

  // Reveal on scroll
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

  // Handle persona highlight or #engine scroll from navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const persona = params.get('persona')
    const hash = location.hash

    if (hash === '#engine' || persona) {
      const timer = setTimeout(() => {
        const engineEl = document.getElementById('engine')
        if (engineEl) {
          engineEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }

        if (persona) {
          const tickMap = {
            'Capital gains': 'ITR-1 · ITR-2',
            'Freelancer': 'ITR-3 · ITR-4',
            'NRI': 'RESIDENCY',
            'Crypto': 'NEWER HEADS',
          }
          const tickTarget = tickMap[persona]
          if (tickTarget) {
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
              }, 1800)
            }
          }
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location])

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      <SiteNav theme={theme} toggleTheme={toggleTheme} />

      {/* ══ SECTION 1 — HERO ══ */}
      <header className="hero" style={{ paddingBottom: 48 }}>
        <div className="wrap hero-in">
          <div className="eyebrow">About Taxly</div>
          <h1>Fast filing. <em>Not careless filing.</em></h1>
          <p className="hero-sub">
            Built because the portal crashes every July, CAs are booked solid by 
            the time you call, and the alternative was always "fill in the form 
            yourself and hope."
          </p>
        </div>
      </header>

      {/* ══ SECTION 2 — STORY + STATS ══ */}
      <section style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 48 }}>
        <div className="wrap feat rv">
          <div className="feat-copy">
            <div className="sec-num"><b>Story</b> Why this exists</div>
            <h2>Tax filing shouldn't <em>require a CA friend.</em></h2>
            <p className="sec-sub" style={{ marginBottom: 20 }}>
              Taxly reads your Form 16, your TDS certificates, and your bank 
              statement — then puts a chartered accountant on anything that needs 
              a human judgment call. The conversation and the document parsing use 
              language models. The tax math does not.
            </p>
            <ul className="feat-points">
              <li>
                <h4>Every rupee, deterministic</h4>
                <p>
                  The calculation engine is plain Python with hardcoded Finance 
                  Act rules — the same logic a CA runs in Excel, automated and 
                  tested.
                </p>
              </li>
              <li>
                <h4>A CA checks what's uncertain</h4>
                <p>
                  Taxly flags, never files on its own. Anything ambiguous reaches 
                  a human before it reaches your return.
                </p>
              </li>
            </ul>
          </div>
          <div className="feat-demo">
            <div className="outs" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="out">
                <b>134</b>
                <span>AUTOMATED TESTS</span>
              </div>
              <div className="out">
                <b>5</b>
                <span>TDS CERTIFICATE TYPES</span>
              </div>
              <div className="out">
                <b>20 min</b>
                <span>MEDIAN FILING TIME</span>
              </div>
              <div className="out">
                <b>0</b>
                <span>AI IN THE ARITHMETIC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 — TAX ENGINE COVERAGE ══ */}
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

      {/* ══ SECTION 4 — TRUST & SECURITY ══ */}
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
                Documents and filing data live in Supabase with row-level
                security — accessible only to your account and the CA assigned to
                your filing.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">USAGE</span>
              <h4>Never sold, never shared</h4>
              <p>
                Your data is used exclusively to prepare your return. Not sold,
                not rented, not used for anything else.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">AI SCOPE</span>
              <h4>AI reads. It doesn't decide.</h4>
              <p>
                Language models handle conversation and parsing. Every number in
                your return comes from deterministic code.
              </p>
            </div>
            <div className="eng-c">
              <span className="tick">ACCOUNTABILITY</span>
              <h4>Mistakes are on us</h4>
              <p>
                If our engine causes a defect notice, we file your revised return
                free and cover any interest our error caused.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5 — CTA BAND ══ */}
      <div className="cta">
        <div className="wrap cta-in">
          <h2>See it for yourself.</h2>
          <p>20 MINUTES · NO CARD UPFRONT</p>
          <Link to="/login" className="btn btn-fill btn-lg">Start filing free →</Link>
        </div>
      </div>

      <SiteFooter theme={theme} />
    </div>
  )
}
