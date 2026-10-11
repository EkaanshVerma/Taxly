import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './TaxlyStickyShowcase.css'

export const TAXLY_FEATURES = [
  {
    id: 'ais-reconciliation',
    phase: 'PHASE 1',
    badge: 'DATA INGESTION',
    title: 'AIS & 26AS Reconciliation',
    shortDesc: 'Automated cross-referencing of Form 26AS, Annual Information Statement (AIS), and TIS to detect discrepancies before filing.',
    details: [
      'Zero mismatched tax credits',
      'Automated quarterly TDS cross-check',
      'Dividend & high-value transaction detection'
    ]
  },
  {
    id: 'multi-source-ingestion',
    phase: 'PHASE 2',
    badge: 'INTELLIGENT PARSING',
    title: 'Multi-Source Ingestion',
    shortDesc: 'Ingest salary slips, capital gains reports (Zerodha, Groww), bank statements, and crypto ledgers into unified structured models.',
    details: [
      'Direct broker CSV / P&L parsing',
      'Section 112A grand-fathering computation',
      'Foreign asset schedule FA generation'
    ]
  },
  {
    id: 'regime-optimizer',
    phase: 'PHASE 3',
    badge: 'ALGORITHMIC AUDIT',
    title: 'Regime & Deduction Optimizer',
    shortDesc: 'Simulates Old vs New Tax Regime with automated calculation of 80C, 80D, HRA exemptions, and Section 87A rebate.',
    details: [
      'Dynamic slab comparison in real-time',
      'Maximum deduction discovery engine',
      'Marginal relief calculation under Sec 115BAC'
    ]
  },
  {
    id: 'deterministic-engine',
    phase: 'PHASE 4',
    badge: 'COMPLIANCE ENGINE',
    title: 'Deterministic Tax Engine',
    shortDesc: 'Runs 130+ unit-tested statutory rules with zero LLM hallucination in arithmetic or tax slab bracket thresholds.',
    details: [
      'Mathematical proof guarantees zero arithmetic error',
      'CBDT schema compliance verification',
      'Automated Section 234A/B/C interest calculation'
    ]
  },
  {
    id: 'ca-certified-dispatch',
    phase: 'PHASE 5',
    badge: 'AUDITED SUBMISSION',
    title: 'CA Certified E-Filing',
    shortDesc: 'Final verification by chartered accountants, generation of valid ITR JSON/XML, and direct submission to the ITD portal.',
    details: [
      'ICAI-registered CA digital sign-off',
      'Direct ITD e-filing API integration',
      'Instant ITR-V acknowledgement tracking'
    ]
  }
]

export default function TaxlyStickyShowcase() {
  const [activeIdx, setActiveIdx] = useState(0)
  const isClickScrolling = useRef(false)
  const scrollTimeoutRef = useRef(null)
  const sectionRefs = useRef([])
  const menuBtnRefs = useRef([])
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 48 })

  // Calculate indicator height and position based on active item
  const updateIndicator = useCallback((index) => {
    const activeBtn = menuBtnRefs.current[index]
    if (activeBtn) {
      setIndicatorStyle({
        top: activeBtn.offsetTop,
        height: activeBtn.offsetHeight
      })
    }
  }, [])

  useEffect(() => {
    updateIndicator(activeIdx)
    const handleResize = () => updateIndicator(activeIdx)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeIdx, updateIndicator])

  // Setup IntersectionObserver to track active section with threshold 0.5
  useEffect(() => {
    const observerOptions = {
      root: null,
      threshold: 0.5,
      rootMargin: '-10% 0px -10% 0px'
    }

    const observerCallback = (entries) => {
      // If user clicked a menu item, do not allow observer to flicker active states during smooth scroll
      if (isClickScrolling.current) return

      // Find the entry with highest intersection ratio that meets threshold
      let bestEntry = null
      let maxRatio = 0

      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio
          bestEntry = entry
        }
      }

      if (bestEntry) {
        const index = Number(bestEntry.target.dataset.index)
        if (!isNaN(index) && index !== activeIdx) {
          setActiveIdx(index)
          updateIndicator(index)
        }
      }
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)
    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => {
      observer.disconnect()
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [activeIdx, updateIndicator])

  // Click handler: smooth scroll without breaking observer state
  const handleMenuClick = (index) => {
    if (index === activeIdx) return
    isClickScrolling.current = true
    setActiveIdx(index)
    updateIndicator(index)

    const targetSection = sectionRefs.current[index]
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    // Release click lock after smooth scroll settles
    scrollTimeoutRef.current = setTimeout(() => {
      isClickScrolling.current = false
    }, 750)
  }

  return (
    <div className="taxly-sticky-showcase-wrapper relative w-full bg-[#080b10] text-[#f0f6fc]">
      {/* ── STICKY PINNED TWO-COLUMN VIEWPORT ── */}
      <div className="sticky top-0 z-10 h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="taxly-showcase-card pointer-events-auto w-full max-w-7xl h-[88vh] max-h-[780px] bg-[#0c1017]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row overflow-hidden">
          
          {/* ── LEFT COLUMN: VERTICAL NAVIGATION MENU ── */}
          <div className="taxly-showcase-nav w-full md:w-[380px] lg:w-[420px] p-6 lg:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 relative z-20 bg-[#0c1017]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-semibold tracking-widest text-[#10b981] uppercase">
                  Taxly Intelligence Core
                </span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white">
                Deterministic Accuracy. <span className="text-white/60">Every Source.</span>
              </h3>
            </div>

            {/* Menu List & Vertical Animated Indicator */}
            <div className="relative flex-1 flex flex-col justify-center my-auto">
              {/* Vertical border line beside menu */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/10 rounded-full">
                {/* Framer Motion Animated Indicator Block */}
                <motion.div
                  className="absolute left-[-1px] w-[4px] bg-[#10b981] rounded-full shadow-[0_0_12px_#10b981]"
                  animate={{
                    top: indicatorStyle.top,
                    height: indicatorStyle.height
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 35
                  }}
                />
              </div>

              {/* Menu items */}
              <div className="pl-6 flex flex-col gap-3 lg:gap-4">
                {TAXLY_FEATURES.map((item, idx) => {
                  const isActive = activeIdx === idx
                  return (
                    <button
                      key={item.id}
                      ref={(el) => (menuBtnRefs.current[idx] = el)}
                      onClick={() => handleMenuClick(idx)}
                      type="button"
                      className={`taxly-menu-item text-left transition-all duration-200 outline-none group py-2 px-1 rounded-lg ${
                        isActive ? 'opacity-100' : 'opacity-40 hover:opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold tracking-wider ${
                          isActive ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-white/5 text-white/50'
                        }`}>
                          {item.badge}
                        </span>
                        <span className="text-[11px] font-mono text-white/40">
                          0{idx + 1}
                        </span>
                      </div>

                      <h4 className={`text-sm lg:text-base font-semibold tracking-tight transition-colors ${
                        isActive ? 'text-white' : 'text-white/70 group-hover:text-white'
                      }`}>
                        {item.title}
                      </h4>

                      {/* Accordion description */}
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                          isActive ? 'grid-rows-[1fr] opacity-100 mt-1.5' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs text-white/60 leading-relaxed">
                            {item.shortDesc}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.details.map((detail, di) => (
                              <span
                                key={di}
                                className="inline-flex items-center gap-1 text-[10px] text-white/70 bg-white/5 px-2 py-0.5 rounded border border-white/5"
                              >
                                <span className="text-[#10b981]">✓</span> {detail}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Status bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
              <span>CBDT AY 2025-26</span>
              <span className="flex items-center gap-1.5 text-[#10b981]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Stage {activeIdx + 1} of 5
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: DEDICATED VISUAL CANVAS ── */}
          <div className="taxly-showcase-canvas flex-1 relative bg-[#070a0e] p-4 lg:p-8 flex items-center justify-center overflow-hidden">
            {/* Ambient Background Grid & Glow (PERSISTENT BASE) */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full pointer-events-none blur-3xl"
              animate={{
                background:
                  activeIdx === 0
                    ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)'
                    : activeIdx === 1
                    ? 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)'
                    : activeIdx === 2
                    ? 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)'
                    : activeIdx === 3
                    ? 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(240,64,6,0.18) 0%, transparent 70%)'
              }}
              transition={{ duration: 0.6 }}
            />

            {/* ══ PERSISTENT BASE CONTAINER (Never unmounts, layers build sequentially) ══ */}
            <div className="relative w-full max-w-xl bg-[#0d121c] border border-white/10 rounded-xl p-5 shadow-2xl flex flex-col gap-4 z-10">
              
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-white/50 ml-2">taxly://engine/filing-session</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-white/60">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">ITR-2</span>
                  <span className="text-[#10b981]">● Live Sync</span>
                </div>
              </div>

              {/* ── LAYER 0: AIS & 26AS BASE RECONCILIATION (Always present) ── */}
              <div className="flex flex-col gap-3">
                <div className="text-xs font-semibold text-white/70 uppercase tracking-wider flex items-center justify-between">
                  <span>Tax Credit Ledger</span>
                  <span className="text-[#10b981] font-mono">0 Discrepancy Found</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#121824] border border-white/5 rounded-lg p-3 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40">FORM 26AS</span>
                    <span className="text-sm font-bold text-white mt-1">₹3,42,800</span>
                    <span className="text-[10px] text-[#10b981] mt-0.5">✓ 4 Quarters Matched</span>
                  </div>
                  <div className="bg-[#121824] border border-white/5 rounded-lg p-3 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40">AIS / TIS FEED</span>
                    <span className="text-sm font-bold text-white mt-1">₹18,50,000</span>
                    <span className="text-[10px] text-[#10b981] mt-0.5">✓ 18 Entries Normalized</span>
                  </div>
                  <div className="bg-[#121824] border border-white/5 rounded-lg p-3 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40">NET TDS CLAIM</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1">₹3,42,800</span>
                    <span className="text-[10px] text-white/50 mt-0.5">100% Reconciled</span>
                  </div>
                </div>
              </div>

              {/* ── LAYER 1: MULTI-SOURCE INGESTION (Revealed when activeIdx >= 1) ── */}
              <motion.div
                initial={false}
                animate={{
                  opacity: activeIdx >= 1 ? 1 : 0.25,
                  scale: activeIdx >= 1 ? 1 : 0.98,
                  filter: activeIdx >= 1 ? 'grayscale(0%)' : 'grayscale(100%)'
                }}
                transition={{ duration: 0.35 }}
                className="bg-[#131a29] border border-white/10 rounded-lg p-3.5 flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Multi-Broker Capital Gains & Salary Parsers
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    4 Connectors Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/5 rounded px-2.5 py-1.5 border border-white/5">
                    <div className="text-[10px] text-white/40">Zerodha</div>
                    <div className="font-semibold text-white">LTCG ₹1.82L</div>
                  </div>
                  <div className="bg-white/5 rounded px-2.5 py-1.5 border border-white/5">
                    <div className="text-[10px] text-white/40">Groww MF</div>
                    <div className="font-semibold text-white">STCG ₹34.5K</div>
                  </div>
                  <div className="bg-white/5 rounded px-2.5 py-1.5 border border-white/5">
                    <div className="text-[10px] text-white/40">Form 16 PDF</div>
                    <div className="font-semibold text-white">Gross ₹24.0L</div>
                  </div>
                  <div className="bg-white/5 rounded px-2.5 py-1.5 border border-white/5">
                    <div className="text-[10px] text-white/40">HDFC Bank</div>
                    <div className="font-semibold text-white">Int. ₹14.2K</div>
                  </div>
                </div>
              </motion.div>

              {/* ── LAYER 2: REGIME & DEDUCTION OPTIMIZER (Revealed when activeIdx >= 2) ── */}
              <motion.div
                initial={false}
                animate={{
                  opacity: activeIdx >= 2 ? 1 : 0.25,
                  scale: activeIdx >= 2 ? 1 : 0.98,
                  filter: activeIdx >= 2 ? 'grayscale(0%)' : 'grayscale(100%)'
                }}
                transition={{ duration: 0.35 }}
                className="bg-[#151c27] border border-amber-500/30 rounded-lg p-3.5 flex flex-col gap-2 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <span>⚡</span> Dual Regime Optimization
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Save ₹34,300 under New Regime
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2 rounded border border-white/5 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-white/50">Old Regime Tax</div>
                      <div className="font-bold text-white/70 line-through">₹2,42,800</div>
                    </div>
                    <span className="text-[10px] text-amber-400/80">Sec 80C/80D maxed</span>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/30 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-emerald-300">New Regime Tax</div>
                      <div className="font-bold text-emerald-400 text-sm">₹2,08,500</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">Optimal Choice ✓</span>
                  </div>
                </div>
              </motion.div>

              {/* ── LAYER 3: DETERMINISTIC TAX ENGINE (Revealed when activeIdx >= 3) ── */}
              <motion.div
                initial={false}
                animate={{
                  opacity: activeIdx >= 3 ? 1 : 0.25,
                  scale: activeIdx >= 3 ? 1 : 0.98,
                  filter: activeIdx >= 3 ? 'grayscale(0%)' : 'grayscale(100%)'
                }}
                transition={{ duration: 0.35 }}
                className="bg-[#101b22] border border-emerald-500/30 rounded-lg p-3.5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center gap-2">
                    <span>🛡️</span> Statutory Deterministic Verification (134 Tests Passed)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Zero LLM Hallucination</span>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                    ✓ Sec 87A: Valid
                  </span>
                  <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                    ✓ Standard Ded: ₹75,000
                  </span>
                  <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                    ✓ Health Cess 4%: ₹8,340
                  </span>
                  <span className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                    ✓ Sec 234B: Nil
                  </span>
                </div>
              </motion.div>

              {/* ── LAYER 4: CA AUDIT & E-FILING DISPATCH (Revealed when activeIdx === 4) ── */}
              <AnimatePresence>
                {activeIdx === 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="bg-[#191114] border border-[#f04006]/40 rounded-lg p-3.5 flex flex-col gap-2.5 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#f04006] flex items-center justify-center text-white text-[10px] font-bold">
                          ✓
                        </div>
                        <span className="text-xs font-semibold text-white">
                          CA Sign-Off &amp; ITD Gateway Ready
                        </span>
                        <span className="text-[10px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                          ICAI Mem #402914
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#f04006] bg-[#f04006]/10 px-2 py-0.5 rounded border border-[#f04006]/30">
                        JSON Validated
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded">
                      <div className="text-white/80">
                        Refund Due: <strong className="text-emerald-400 font-bold">₹1,34,300</strong> into Verified HDFC Bank
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1 bg-[#f04006] hover:bg-[#ff5722] text-white text-xs font-semibold rounded transition shadow-[0_0_12px_rgba(240,64,6,0.5)]"
                      >
                        Submit to ITD Portal →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </div>

      {/* ── TALL SCROLL SECTIONS WRAPPER ── */}
      {/* 5 scroll triggers (each min-h-screen) for native sticky scrolling */}
      <div className="relative z-0">
        {TAXLY_FEATURES.map((item, idx) => (
          <div
            key={item.id}
            ref={(el) => (sectionRefs.current[idx] = el)}
            data-index={idx}
            className="taxly-scroll-section min-h-screen flex items-end md:items-center justify-start p-6 lg:p-12 pointer-events-none"
          >
            {/* Mobile Fallback: Feature card visible inline during mobile scroll */}
            <div className="block md:hidden pointer-events-auto bg-[#0c1017]/90 border border-white/10 rounded-xl p-5 mb-8 backdrop-blur-md w-full max-w-md mx-auto">
              <span className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider">
                {item.phase} · {item.badge}
              </span>
              <h3 className="text-lg font-bold text-white mt-1 mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed mb-3">
                {item.shortDesc}
              </p>
              <div className="flex flex-col gap-1 text-[11px] text-white/60">
                {item.details.map((d, di) => (
                  <span key={di} className="flex items-center gap-1.5">
                    <span className="text-[#10b981]">✓</span> {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
