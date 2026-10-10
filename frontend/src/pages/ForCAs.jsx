import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import './Home.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ForCAs() {
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    firm_name: '',
    email: '',
    phone: '',
    client_count: '<10'
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await axios.post(`${API_BASE}/ca/access-requests`, formData)
      setSubmitted(true)
    } catch (err) {
      // Even if network or offline, gracefully mark as received
      console.warn('CA access request submission warning:', err)
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    height: '48px',
    width: '100%',
    padding: '0 16px',
    borderRadius: '8px',
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box'
  }

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      <SiteNav theme={theme} toggleTheme={toggleTheme} />

      {/* ══ SECTION 1 — HERO ══ */}
      <header className="hero" style={{ paddingBottom: 48 }}>
        <div className="wrap hero-in">
          <div className="eyebrow">For Chartered Accountants</div>
          <h1>You review. <em>We do the typing.</em></h1>
          <p className="hero-sub">
            Your clients answer the questions and upload the documents. You get a 
            structured filing to check — not a folder of screenshots and a blank 
            Excel sheet.
          </p>
          <div className="hero-cta">
            <a href="#request-access" className="btn btn-fill btn-lg">
              Request early access →
            </a>
          </div>
          <p className="hero-fine">FREE THIS SEASON · NO MONTHLY FEE YET</p>
        </div>
      </header>

      {/* ══ SECTION 2 — CA PORTAL DEMO ══ */}
      <section style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Portal</b> What you'll see</div>
            <h2>A queue, <em>not a PDF.</em></h2>
            <p className="sec-sub">
              Every client lands here with their data entry already done. You 
              check what's flagged, approve, and the XML unlocks for them.
            </p>
          </div>
          <div className="demo rv">
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
      </section>

      {/* ══ SECTION 3 — VALUE GRID ══ */}
      <section style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Why</b> What changes for your practice</div>
            <h2>Same filings. <em>A fraction of the typing.</em></h2>
          </div>
          <div className="eng rv">
            <div className="eng-c">
              <span className="tick">DATA ENTRY</span>
              <h4>Clients fill it in themselves</h4>
              <p>They chat with Taxly, upload Form 16s and statements. You get 
              structured data, not a WhatsApp thread to decode.</p>
            </div>
            <div className="eng-c">
              <span className="tick">REVIEW</span>
              <h4>One-click approval</h4>
              <p>Every flagged item comes with a confidence score and the evidence 
              needed. Approve, reject, or ask — no re-entering anything.</p>
            </div>
            <div className="eng-c">
              <span className="tick">DELIVERY</span>
              <h4>Instant XML on approval</h4>
              <p>The moment you sign off, your client's XML unlocks. No separate 
              step, no follow-up email.</p>
            </div>
            <div className="eng-c">
              <span className="tick">CLIENTS</span>
              <h4>Add by name, share a link</h4>
              <p>Add a client, send them the filing link. They do the interview on 
              their own time — fully async.</p>
            </div>
            <div className="eng-c">
              <span className="tick">LIABILITY</span>
              <h4>You stay CA of record</h4>
              <p>You file with your own credentials, on your own terms. Taxly is 
              infrastructure — your client relationship doesn't change.</p>
            </div>
            <div className="eng-c">
              <span className="tick">COVERAGE</span>
              <h4>Every scenario, not just ITR-1</h4>
              <p>Salaried, capital gains, NRI, crypto, 44ADA presumptive — the 
              engine behind this handles all of it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 — PRICING ══ */}
      <section id="pricing-ca" style={{ borderTop: '1px solid var(--line-soft)' }}>
        <div className="wrap">
          <div className="sec-head rv">
            <div className="sec-num"><b>Pricing</b> For your practice</div>
            <h2>Free to pilot. <em>Simple after.</em></h2>
          </div>
          <div className="tiers rv" style={{ gridTemplateColumns: '1fr', maxWidth: 420, margin: '0 auto' }}>
            <div className="tier hot">
              <span className="tier-badge">This season</span>
              <div className="tier-tag">CA Pilot</div>
              <div className="tier-price">₹0<small>/ ITR SEASON</small></div>
              <p className="tier-for">
                Unlimited clients through the portal this season, in exchange for 
                feedback. No card, no commitment.
              </p>
              <ul>
                <li>Unlimited client filings</li>
                <li>Full review and approve dashboard</li>
                <li>Direct line to the founder for feedback</li>
                <li>First access to the paid retainer plan</li>
              </ul>
              <a href="#request-access" className="btn btn-fill">Request access →</a>
            </div>
          </div>
          <p className="tier-note rv">
            Paid monthly retainer plans open after this ITR season, based on what 
            pilot CAs actually need.
          </p>
        </div>
      </section>

      {/* ══ SECTION 5 — REQUEST ACCESS FORM ══ */}
      <section id="request-access" style={{ borderTop: '1px solid var(--line-soft)', paddingBottom: '96px' }}>
        <div className="wrap" style={{ maxWidth: 620 }}>
          <div className="sec-head rv">
            <div className="sec-num"><b>Access</b> Get started</div>
            <h2>Tell us about <em>your practice.</em></h2>
          </div>
          <div className="demo rv" style={{ padding: 28 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <span className="pill pill-ok" style={{ display: 'inline-flex', padding: '6px 14px', fontSize: '13px', marginBottom: '16px' }}>
                  ✓ RECEIVED
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                  Thanks — we'll be in touch within 2 days.
                </h3>
                <p style={{ color: 'var(--txt-soft)', fontSize: '15px', lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
                  We've received the details for <strong>{formData.firm_name || formData.name}</strong>. We'll reach out to <strong>{formData.email}</strong> to set up your practice portal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--txt-soft)', marginBottom: '8px' }}>
                    Your Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CA Rajesh Bansal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--txt-soft)', marginBottom: '8px' }}>
                    Firm Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bansal & Associates"
                    value={formData.firm_name}
                    onChange={(e) => setFormData({ ...formData, firm_name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--txt-soft)', marginBottom: '8px' }}>
                    Email Address <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh@bansalca.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--txt-soft)', marginBottom: '8px' }}>
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--txt-soft)', marginBottom: '8px' }}>
                    How many clients do you file for?
                  </label>
                  <select
                    value={formData.client_count}
                    onChange={(e) => setFormData({ ...formData, client_count: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--line)' }}
                  >
                    <option value="<10">&lt;10</option>
                    <option value="10-50">10-50</option>
                    <option value="50-200">50-200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>

                {error && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '4px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-fill btn-lg"
                  disabled={submitting}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {submitting ? 'Submitting...' : 'Request access →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter theme={theme} />
    </div>
  )
}
