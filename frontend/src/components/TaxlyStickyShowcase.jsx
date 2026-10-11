import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { TAX_YEAR_CONFIG } from '../config/taxYear.ts'
import { getClaim } from '../content/claims.ts'
import { computeSample, formatINR, formatINRLakh } from '../demo/sampleReturn.ts'
import './TaxlyStickyShowcase.css'

export const getTaxlyStages = (sample) => [
  {
    id: 'ais-reconciliation',
    category: 'DATA INGESTION',
    stepNumber: '01',
    title: 'AIS & 26AS Reconciliation',
    description: 'Automated cross-referencing of Form 26AS, Annual Information Statement (AIS), and TIS to detect discrepancies before filing.',
    chips: ['Form 26AS Verified', `${sample.aisEntriesCount} AIS Entries Reconciled`, getClaim('zeroDiscrepancy')]
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
    chips: ['Dual Regime Simulation', 'Sec 80C/80D Maximized', `${formatINR(sample.savings)} Tax Saved`]
  },
  {
    id: 'deterministic-engine',
    category: 'COMPLIANCE ENGINE',
    stepNumber: '04',
    title: 'Deterministic Tax Engine',
    description: getClaim('deterministicDescription'),
    chips: [getClaim('unitTestsPassedChip'), 'Mathematical Proof', 'Sec 115BAC Relief Verified']
  },
  {
    id: 'ca-certified-dispatch',
    category: 'AUDITED SUBMISSION',
    stepNumber: '05',
    title: 'CA Certified E-Filing',
    description: getClaim('submissionDescription'),
    chips: [getClaim('caSignOff'), getClaim('gatewayVerified'), getClaim('itrAck')]
  }
]

export default function TaxlyStickyShowcase({ id = 'context' }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const runwayRef = useRef(null)
  const stageRef = useRef(null)
  const activeIdxRef = useRef(0)
  const rafIdRef = useRef(null)
  const lockUntilRef = useRef(0)

  const sample = useMemo(() => computeSample(), [])
  const stages = useMemo(() => getTaxlyStages(sample), [sample])
  const n = stages.length

  // Smoothly scroll window to target step and update state
  const scrollToStep = useCallback((idx) => {
    if (!runwayRef.current) return
    const targetIdx = Math.max(0, Math.min(n - 1, idx))

    activeIdxRef.current = targetIdx
    setActiveIdx(targetIdx)

    const r = runwayRef.current.getBoundingClientRect()
    const runwayTop = r.top + window.scrollY
    const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
    const dockTop = 76
    const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - dockTop)
    const total = runwayRef.current.offsetHeight - stageH

    const p = targetIdx / (n - 1)
    runwayRef.current.style.setProperty('--p', p.toString())

    const targetScroll = runwayTop - dockTop + p * total
    const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({
      top: targetScroll,
      behavior: reduced ? 'auto' : 'smooth'
    })
  }, [n])

  // Window scroll, wheel, and touch event listeners
  useEffect(() => {
    // Keep --p CSS var and active step in sync on general page scrolling
    const updateScroll = () => {
      if (!runwayRef.current) return
      const r = runwayRef.current.getBoundingClientRect()
      const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
      const dockTop = 76
      const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - dockTop)
      const total = r.height - stageH

      if (total <= 0) return

      const scrolled = -r.top + dockTop
      const p = Math.max(0, Math.min(1, scrolled / total))

      runwayRef.current.style.setProperty('--p', p.toString())

      // If not currently executing a step-wheel animation lock, sync activeIdx
      if (Date.now() >= lockUntilRef.current) {
        const index = Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))
        if (index !== activeIdxRef.current) {
          activeIdxRef.current = index
          setActiveIdx(index)
        }
      }
    }

    const onScroll = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = requestAnimationFrame(updateScroll)
    }

    // Step-snapped wheel handling: every scroll flick advances 1 step
    const onWheel = (e) => {
      if (!runwayRef.current) return
      const r = runwayRef.current.getBoundingClientRect()
      const dockTop = 76
      const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
      const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - dockTop)
      const total = runwayRef.current.offsetHeight - stageH

      if (total <= 0) return

      // Stage is pinned while inside the runway boundaries
      const isDocked = r.top <= dockTop + 15 && r.bottom >= stageH + dockTop - 15

      if (!isDocked) {
        // Outside the sticky runway, allow normal native page scroll
        return
      }

      const delta = e.deltaY
      if (Math.abs(delta) < 8) return

      const now = Date.now()
      const isLocked = now < lockUntilRef.current

      // Scrolling DOWN
      if (delta > 0) {
        if (activeIdxRef.current < n - 1) {
          e.preventDefault()
          if (!isLocked) {
            lockUntilRef.current = now + 480
            scrollToStep(activeIdxRef.current + 1)
          }
        }
        // At last step (step 4), do NOT preventDefault: page scrolls down naturally to next section
      }
      // Scrolling UP
      else if (delta < 0) {
        if (activeIdxRef.current > 0) {
          e.preventDefault()
          if (!isLocked) {
            lockUntilRef.current = now + 480
            scrollToStep(activeIdxRef.current - 1)
          }
        }
        // At first step (step 0), do NOT preventDefault: page scrolls up naturally to previous section
      }
    }

    // Touch gesture support for mobile/tablets
    let touchStartY = 0
    const onTouchStart = (e) => {
      touchStartY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (!runwayRef.current) return
      const r = runwayRef.current.getBoundingClientRect()
      const dockTop = 76
      const stageEl = stageRef.current || runwayRef.current.querySelector('.taxly-stage')
      const stageH = stageEl ? stageEl.offsetHeight : (window.innerHeight - dockTop)
      const total = runwayRef.current.offsetHeight - stageH

      if (total <= 0) return
      const isDocked = r.top <= dockTop + 15 && r.bottom >= stageH + dockTop - 15
      if (!isDocked) return

      const currentY = e.touches[0].clientY
      const diff = touchStartY - currentY
      if (Math.abs(diff) < 25) return

      const now = Date.now()
      const isLocked = now < lockUntilRef.current

      if (diff > 0) {
        // Swiping UP (scrolling DOWN)
        if (activeIdxRef.current < n - 1) {
          if (e.cancelable) e.preventDefault()
          if (!isLocked) {
            lockUntilRef.current = now + 480
            touchStartY = currentY
            scrollToStep(activeIdxRef.current + 1)
          }
        }
      } else if (diff < 0) {
        // Swiping DOWN (scrolling UP)
        if (activeIdxRef.current > 0) {
          if (e.cancelable) e.preventDefault()
          if (!isLocked) {
            lockUntilRef.current = now + 480
            touchStartY = currentY
            scrollToStep(activeIdxRef.current - 1)
          }
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    window.addEventListener('load', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateScroll)
    }

    updateScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('load', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [n, scrollToStep])

  // Click/keyboard handler
  const handleStepClick = useCallback((i) => {
    scrollToStep(i)
  }, [scrollToStep])

  return (
    <section id={id} className="taxly-runway" ref={runwayRef} style={{ '--n': n }}>
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
                <span>Deterministic accuracy.</span>
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
                  {stages.map((step, idx) => {
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
                {getClaim('rulesEngine')}
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN (7fr) ── */}
          <div className="taxly-col-right">
            {/* Ambient Background Glow */}
            <div className="taxly-ambient-glow" />
            <div className="taxly-dotted-grid" />

            {/* Mockup Window */}
            <div className="taxly-mockup-window">
              {/* Window Header */}
              <div className="taxly-window-topbar">
                <div className="taxly-mac-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="taxly-window-url font-tabular">
                  taxly://filing/session?ay={TAX_YEAR_CONFIG.aySlug}
                </div>
                <div className="taxly-window-right">
                  <span className="taxly-sample-tag font-tabular font-mono">SAMPLE DATA</span>
                  <div className="taxly-window-badge">
                    <span className="taxly-live-dot" />
                    <span className="font-tabular">{getClaim('itr2Verified')}</span>
                  </div>
                </div>
              </div>

              {/* Window Body (All 5 Modules Visible, Active Emphasised) */}
              <div className="taxly-window-body">
                
                {/* MODULE 0: AIS & 26AS RECONCILIATION (Owned by Step 1, activeIdx === 0) */}
                <div className={`taxly-card-panel ${activeIdx === 0 ? 'module-active' : ''}`}>
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Tax Credit Stream</span>
                    <span className={activeIdx === 0 ? 'taxly-status-tag-green' : 'taxly-status-tag'}>
                      {getClaim('zeroDiscrepancy')}
                    </span>
                  </div>

                  <div className="taxly-ledger-grid">
                    <div className="taxly-metric-box">
                      <span className="taxly-metric-lbl">FORM 26AS</span>
                      <span className="taxly-metric-val font-tabular">{formatINR(sample.form26asTds)}</span>
                      <span className="taxly-metric-sub font-tabular">{sample.qtrsMatchedCount} Qtrs Matched</span>
                    </div>
                    <div className="taxly-metric-box">
                      <span className="taxly-metric-lbl">AIS / TIS FEED</span>
                      <span className="taxly-metric-val font-tabular">{formatINR(sample.aisTisFeed)}</span>
                      <span className="taxly-metric-sub font-tabular">{sample.aisEntriesCount} Entries Normal</span>
                    </div>
                    <div className={`taxly-metric-box ${activeIdx === 0 ? 'highlight' : ''}`}>
                      <span className="taxly-metric-lbl">NET TDS CLAIM</span>
                      <span className={`taxly-metric-val font-tabular ${activeIdx === 0 ? 'accent' : ''}`}>
                        {formatINR(sample.netTdsClaim)}
                      </span>
                      <span className="taxly-metric-sub font-tabular">{getClaim('eligibleCredits')}</span>
                    </div>
                  </div>
                </div>

                {/* MODULE 1: MULTI-SOURCE INGESTION (Owned by Step 2, activeIdx === 1) */}
                <div className={`taxly-card-panel ${activeIdx === 1 ? 'module-active' : ''}`}>
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Multi-Broker Capital Gains &amp; Salary</span>
                    <span className="taxly-status-tag font-tabular">4 Connectors</span>
                  </div>

                  <div className="taxly-connectors-grid">
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Zerodha</span>
                      <span className="taxly-conn-amount font-tabular">LTCG {formatINRLakh(sample.zerodhaLtcg)}</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Groww MF</span>
                      <span className="taxly-conn-amount font-tabular">STCG {formatINRLakh(sample.growwStcg)}</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">Form 16 PDF</span>
                      <span className="taxly-conn-amount font-tabular">Gross {formatINRLakh(sample.form16Gross)}</span>
                    </div>
                    <div className="taxly-conn-box">
                      <span className="taxly-conn-name">HDFC Bank</span>
                      <span className="taxly-conn-amount font-tabular">Int. {formatINRLakh(sample.hdfcInterest)}</span>
                    </div>
                  </div>
                </div>

                {/* MODULE 2: REGIME OPTIMIZER (Owned by Step 3, activeIdx === 2) */}
                <div className={`taxly-card-panel ${activeIdx === 2 ? 'module-active' : ''}`}>
                  <div className="taxly-panel-header">
                    <span className="taxly-panel-label">Dual Regime Simulation</span>
                    <span className={`taxly-badge-save font-tabular ${activeIdx === 2 ? 'highlight' : ''}`}>
                      Save {formatINR(sample.savings)} (New Regime)
                    </span>
                  </div>

                  <div className="taxly-regime-grid">
                    <div className="taxly-regime-box">
                      <span className="taxly-regime-title">Old Regime Tax</span>
                      <span className="taxly-regime-amount strike font-tabular">{formatINR(sample.oldTotalTax)}</span>
                      <span className="taxly-regime-meta">Max 80C + 80D applied</span>
                    </div>
                    <div className={`taxly-regime-box ${activeIdx === 2 ? 'winner' : ''}`}>
                      <span className={`taxly-regime-title ${activeIdx === 2 ? 'accent' : ''}`}>New Regime Tax</span>
                      <span className={`taxly-regime-amount font-tabular ${activeIdx === 2 ? 'accent' : ''}`}>
                        {formatINR(sample.newTotalTax)}
                      </span>
                      <span className={`taxly-regime-meta ${activeIdx === 2 ? 'accent' : ''}`}>
                        Cheaper &amp; Zero Paperwork ✓
                      </span>
                    </div>
                  </div>
                </div>

                {/* MODULE 3: DETERMINISTIC TAX ENGINE (Owned by Step 4, activeIdx === 3) */}
                <div className={`taxly-card-panel ${activeIdx === 3 ? 'module-active' : ''}`}>
                  <div className="taxly-audit-row">
                    <div className="taxly-audit-icon-wrapper">
                      <ShieldCheck size={20} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="taxly-audit-text">
                      <div className="taxly-audit-head">
                        <span>{getClaim('statutoryUnitTests')}</span>
                        <span className="taxly-audit-proof font-tabular">{getClaim('zeroHallucination')}</span>
                      </div>
                      <div className="taxly-audit-tags font-tabular">
                        <span>✓ Sec 87A rebate</span>
                        <span>✓ Std Ded {formatINR(sample.standardDeduction)}</span>
                        <span>✓ Cess 4%: {formatINR(sample.newCess)}</span>
                        <span>✓ Sec 234A/B/C: {formatINR(sample.sec234Interest)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODULE 4: CA CERTIFIED DISPATCH (Owned by Step 5, activeIdx === 4) */}
                <div className={`taxly-ca-dispatch-card ${activeIdx === 4 ? 'module-active' : ''}`}>
                  <div className="taxly-ca-left">
                    <div className="taxly-ca-badge-icon">✓</div>
                    <div>
                      <div className="taxly-ca-title">
                        {getClaim('caCertifiedTitle')}
                      </div>
                      <div className="taxly-ca-sub">
                        Refund Due: <strong className="font-tabular">{formatINR(sample.refundDue)}</strong> into Verified HDFC Bank
                      </div>
                    </div>
                  </div>
                  <div
                    className="taxly-dispatch-btn font-tabular"
                    aria-hidden="true"
                    tabIndex={-1}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    Sample action
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
