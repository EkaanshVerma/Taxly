import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './TaxlyStickyShowcase.css'

export const TAXLY_STAGES = [
  {
    id: 'ais-reconciliation',
    category: 'DATA INGESTION',
    stepNumber: '01',
    title: 'AIS & 26AS Reconciliation',
    description: 'Automated cross-referencing of Form 26AS, Annual Information Statement (AIS), and TIS to detect discrepancies before filing.',
    chips: ['Form 26AS Verified', '18 AIS Entries Reconciled', 'Zero Mismatched Credits']
  },
  {
    id: 'multi-source-ingestion',
    category: 'INTELLIGENT PARSING',
    stepNumber: '02',
    title: 'Multi-Source Ingestion',
    description: 'Ingest salary slips, capital gains reports (Zerodha, Groww), bank statements, and crypto ledgers into unified structured models.',
    chips: ['Zerodha P&L Parsed', 'Form 16 Standardized', 'Foreign Assets (FA)']
  },
  {
    id: 'regime-optimizer',
    category: 'ALGORITHMIC AUDIT',
    stepNumber: '03',
    title: 'Regime & Deduction Optimizer',
    description: 'Simulates Old vs New Tax Regime with automated calculation of 80C, 80D, HRA exemptions, and Section 87A rebate.',
    chips: ['Dual Regime Simulation', 'Sec 80C/80D Maximized', '₹34,300 Tax Saved']
  },
  {
    id: 'deterministic-engine',
    category: 'COMPLIANCE ENGINE',
    stepNumber: '04',
    title: 'Deterministic Tax Engine',
    description: 'Runs 130+ unit-tested statutory rules with zero LLM hallucination in arithmetic or tax slab bracket thresholds.',
    chips: ['134 Unit Tests Passed', 'Mathematical Proof', 'Sec 115BAC Relief Verified']
  },
  {
    id: 'ca-certified-dispatch',
    category: 'AUDITED SUBMISSION',
    stepNumber: '05',
    title: 'CA Certified E-Filing',
    description: 'Final verification by chartered accountants, generation of valid ITR JSON/XML, and direct submission to the ITD portal.',
    chips: ['ICAI CA Sign-Off', 'ITD Gateway Verified', 'Instant ITR-V Ack']
  }
]

export default function TaxlyStickyShowcase({ id = 'context' }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const runwayRef = useRef(null)
  const stageRef = useRef(null)
  const activeIdxRef = useRef(0)
  const rafIdRef = useRef(null)

  // Window scroll-driven sticky runway logic
  useEffect(() => {
    const n = TAXLY_STAGES.length

    const updateScroll = () => {
      if (!runwayRef.current) return
      const r = runwayRef.current.getBoundingClientRect()
      const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
      const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - 76)
      const dockTop = 76 // 64px nav-h + 12px margin

      // 40vh buffer at top before steps advance, 40vh buffer at bottom
      const topPad = window.innerHeight * 0.4
      const botPad = window.innerHeight * 0.4
      const total = (r.height - stageH) - topPad - botPad

      if (total <= 0) return

      const scrolled = -r.top + dockTop
      const p = Math.max(0, Math.min(1, (scrolled - topPad) / total))
      const index = Math.min(n - 1, Math.max(0, Math.floor(p * n)))

      runwayRef.current.style.setProperty('--p', p.toString())

      if (index !== activeIdxRef.current) {
        activeIdxRef.current = index
        setActiveIdx(index)
      }
    }

    const onScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(updateScroll)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('load', onScroll, { passive: true })
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateScroll)
    }

    // Initial calculation
    updateScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('load', onScroll)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  // Optional click/keyboard handler: smoothly scrolls window to target step
  const handleStepClick = useCallback((i) => {
    if (!runwayRef.current) return
    const n = TAXLY_STAGES.length
    const runwayTop = runwayRef.current.getBoundingClientRect().top + window.scrollY
    const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
    const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - 76)
    const dockTop = 76
    const topPad = window.innerHeight * 0.4
    const botPad = window.innerHeight * 0.4
    const total = (runwayRef.current.offsetHeight - stageH) - topPad - botPad
    const targetScroll = runwayTop - dockTop + topPad + ((i + 0.5) / n) * total
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({
      top: targetScroll,
      behavior: reduced ? 'auto' : 'smooth'
    })
  }, [])

  return (
    <section id={id} className="taxly-runway" ref={runwayRef} style={{ '--n': TAXLY_STAGES.length }}>
      {/* ── STAGE: STICKY VIEWPORT PINNED CONTAINER ── */}
      <div className="taxly-stage" ref={stageRef}>
        <div className="taxly-showcase-container">
          
          {/* ── LEFT COLUMN (5fr) ── */}
          <div className="taxly-col-left">
            {/* 1. HEADER ZONE */}
            <div className="taxly-header-zone">
              <div className="taxly-eyebrow">
                <span className="taxly-eyebrow-dot" />
                <span>TAXLY INTELLIGENCE CORE</span>
              </div>
              <h2 className="taxly-headline">
                <span>Deterministic accuracy.</span>{' '}
                <span className="taxly-headline-muted">Every source.</span>
              </h2>
            </div>

            {/* 2. STEPS ZONE: PROGRESS RAIL & STEPPER */}
            <div className="taxly-steps-zone">
              <div className="taxly-stepper-rail-wrapper">
                {/* 2px Progress Rail Track */}
                <div className="taxly-rail-track" />
                {/* Continuous Fill Segment driven by window scroll progress */}
                <div className="taxly-rail-fill" />

                {/* Steps List */}
                <div className="taxly-steps-list">
                  {TAXLY_STAGES.map((step, idx) => {
                    const isActive = activeIdx === idx
                    const isDone = activeIdx > idx

                    return (
                      <div
                        key={step.id}
                        className={`taxly-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                        onClick={() => handleStepClick(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleStepClick(idx)
                        }}
                      >
                        {/* 10px Rail Node */}
                        <div className={`taxly-rail-node ${isActive ? 'node-active' : isDone ? 'node-done' : 'node-upcoming'}`}>
                          {isActive && <span className="taxly-node-glow-ring" />}
                        </div>

                        {/* Step Text Content */}
                        <div className="taxly-step-content">
                          <div className={`taxly-step-category ${isActive ? 'cat-active' : ''}`}>
                            {step.category} {step.stepNumber}
                          </div>

                          <h3 className={`taxly-step-title ${isActive ? 'title-active' : ''}`}>
                            {step.title}
                          </h3>

                          {/* Accordion Description & Chips for Active Item */}
                          <div className={`taxly-step-accordion ${isActive ? 'open' : ''}`}>
                            <div className="taxly-accordion-inner">
                              <p className="taxly-step-desc">
                                {step.description}
                              </p>

                              {/* Chips row */}
                              <div className="taxly-chips-row">
                                {step.chips.map((chip, ci) => (
                                  <span key={ci} className="taxly-chip">
                                    <svg
                                      className="taxly-chip-check"
                                      viewBox="0 0 16 16"
                                      width="14"
                                      height="14"
                                      fill="currentColor"
                                    >
                                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                                    </svg>
                                    <span>{chip}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. META ZONE */}
            <div className="taxly-meta-zone">
              <span className="taxly-meta-stage font-tabular">
                Stage {activeIdx + 1} of 5
              </span>
              <span className="taxly-meta-note">
                Live CBDT AY 2025-26 Engine
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN (7fr) ── */}
          <div className="taxly-col-right">
            {/* Ambient Background Glow (6% light, 8% dark) */}
            <div className="taxly-ambient-glow" />
            <div className="taxly-dotted-grid" />

            {/* Mockup Window (Centered, width up to 680px) */}
            <div className="taxly-mockup-window">
              {/* Window Header */}
              <div className="taxly-window-topbar">
                <div className="taxly-mac-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="taxly-window-url font-tabular">
                  taxly://filing/session?ay=2025-26
                </div>
                <div className="taxly-window-badge">
                  <span className="taxly-live-dot" />
                  <span className="font-tabular">ITR-2 Verified</span>
                </div>
              </div>

              {/* Window Body (Persistent Base + Sequential Layers) */}
              <div className="taxly-window-body">
                
                {/* LAYER 0: AIS & 26AS RECONCILIATION */}
                <div className="taxly-card-panel">
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Tax Credit Stream</span>
                    <span className="taxly-status-tag-green">0 Discrepancy</span>
                  </div>

                  <div className="taxly-ledger-grid">
                    <div className="taxly-metric-box">
                      <span className="taxly-metric-lbl">FORM 26AS</span>
                      <span className="taxly-metric-val font-tabular">₹3,42,800</span>
                      <span className="taxly-metric-sub font-tabular">4 Qtrs Matched</span>
                    </div>
                    <div className="taxly-metric-box">
                      <span className="taxly-metric-lbl">AIS / TIS FEED</span>
                      <span className="taxly-metric-val font-tabular">₹18,50,000</span>
                      <span className="taxly-metric-sub font-tabular">18 Entries Normal</span>
                    </div>
                    <div className="taxly-metric-box highlight">
                      <span className="taxly-metric-lbl">NET TDS CLAIM</span>
                      <span className="taxly-metric-val accent font-tabular">₹3,42,800</span>
                      <span className="taxly-metric-sub font-tabular">100% Eligible</span>
                    </div>
                  </div>
                </div>

                {/* LAYER 1: MULTI-SOURCE INGESTION (Revealed when activeIdx >= 1) */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: activeIdx >= 1 ? 1 : 0.28,
                    scale: activeIdx >= 1 ? 1 : 0.985,
                    filter: activeIdx >= 1 ? 'grayscale(0%)' : 'grayscale(100%)'
                  }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="taxly-card-panel"
                >
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Multi-Broker Capital Gains &amp; Salary</span>
                    <span className="taxly-status-tag font-tabular">4 Connectors</span>
                  </div>

                  <div className="taxly-connectors-grid">
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Zerodha</span>
                      <span className="taxly-conn-amount font-tabular">LTCG ₹1.82L</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Groww MF</span>
                      <span className="taxly-conn-amount font-tabular">STCG ₹34.5K</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Form 16 PDF</span>
                      <span className="taxly-conn-amount font-tabular">Gross ₹24.0L</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">HDFC Bank</span>
                      <span className="taxly-conn-amount font-tabular">Int. ₹14.2K</span>
                    </div>
                  </div>
                </motion.div>

                {/* LAYER 2: REGIME OPTIMIZER (Revealed when activeIdx >= 2) */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: activeIdx >= 2 ? 1 : 0.28,
                    scale: activeIdx >= 2 ? 1 : 0.985,
                    filter: activeIdx >= 2 ? 'grayscale(0%)' : 'grayscale(100%)'
                  }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="taxly-card-panel"
                >
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Dual Regime Simulation</span>
                    <span className="taxly-badge-save font-tabular">
                      Save ₹34,300 (New Regime)
                    </span>
                  </div>

                  <div className="taxly-regime-grid">
                    <div className="taxly-regime-box">
                      <span className="taxly-regime-title">Old Regime Tax</span>
                      <span className="taxly-regime-amount strike font-tabular">₹2,42,800</span>
                      <span className="taxly-regime-meta">Max 80C + 80D applied</span>
                    </div>
                    <div className="taxly-regime-box winner">
                      <span className="taxly-regime-title accent">New Regime Tax</span>
                      <span className="taxly-regime-amount accent font-tabular">₹2,08,500</span>
                      <span className="taxly-regime-meta accent">Cheaper &amp; Zero Paperwork ✓</span>
                    </div>
                  </div>
                </motion.div>

                {/* LAYER 3: DETERMINISTIC TAX ENGINE (Revealed when activeIdx >= 3) */}
                <motion.div
                  initial={false}
                  animate={{
                    opacity: activeIdx >= 3 ? 1 : 0.28,
                    scale: activeIdx >= 3 ? 1 : 0.985,
                    filter: activeIdx >= 3 ? 'grayscale(0%)' : 'grayscale(100%)'
                  }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="taxly-card-panel"
                >
                  <div className="taxly-audit-row">
                    <span className="taxly-audit-icon">🛡️</span>
                    <div className="taxly-audit-text">
                      <div className="taxly-audit-head">
                        <span>134 Statutory Unit Tests Passed</span>
                        <span className="taxly-audit-proof font-tabular">Zero LLM Hallucination</span>
                      </div>
                      <div className="taxly-audit-tags font-tabular">
                        <span>✓ Sec 87A rebate</span>
                        <span>✓ Std Ded ₹75,000</span>
                        <span>✓ Cess 4%: ₹8,340</span>
                        <span>✓ Sec 234A/B/C: ₹0</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* LAYER 4: CA CERTIFIED DISPATCH (Revealed when activeIdx === 4) */}
                <AnimatePresence>
                  {activeIdx === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="taxly-ca-dispatch-card"
                    >
                      <div className="taxly-ca-left">
                        <div className="taxly-ca-badge-icon">✓</div>
                        <div>
                          <div className="taxly-ca-title">
                            CA Certified &amp; ITD Gateway Ready
                          </div>
                          <div className="taxly-ca-sub">
                            Refund Due: <strong className="font-tabular">₹1,34,300</strong> into Verified HDFC Bank
                          </div>
                        </div>
                      </div>
                      <button type="button" className="taxly-dispatch-btn font-tabular">
                        E-File Now →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
