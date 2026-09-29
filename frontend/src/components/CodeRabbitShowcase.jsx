import React, { useState, useEffect, useRef } from 'react'
import './CodeRabbitShowcase.css'

const TABS = [
  {
    id: '01',
    num: '01',
    short: 'Parse',
    full: 'Parse Form 16 & Bank lines instantly',
    tag: 'REAL-TIME DOCUMENT INGESTION',
    status: '100% Processed',
    statusColor: '#10B981',
    subText: 'Scanning 1,284 transactions · OCR Confidence 99.8% · 0 scan errors',
    progress: 100,
  },
  {
    id: '02',
    num: '02',
    short: 'Prioritize',
    full: 'Prioritize deductions by tax savings',
    tag: 'ANOMALY & TRIAGE DETECTION',
    status: 'High Impact Found',
    statusColor: '#F59E0B',
    subText: 'Analyzing credits vs transfers · 3 deductions flagged · 0 penalties',
    progress: 88,
  },
  {
    id: '03',
    num: '03',
    short: 'Understand',
    full: 'Understand Old vs New Regime trade-offs',
    tag: 'REGIME TAX ENGINE OPTIMIZATION',
    status: '₹54,200 Savings',
    statusColor: '#38BDF8',
    subText: 'Simulating 80C, 80D, HRA & NPS · Optimum path: New Regime',
    progress: 94,
  },
  {
    id: '04',
    num: '04',
    short: 'Secure',
    full: 'Secure your filing continually with CA Audit',
    tag: 'REAL-TIME COMPLIANCE HEALTH',
    status: 'Mostly healthy',
    statusColor: '#10B981',
    subText: 'Scanning every deduction · Last scan now · 0 critical alerts',
    progress: 96,
  },
]

export default function CodeRabbitShowcase() {
  const [activeTabIdx, setActiveTabIdx] = useState(3) // Default to Tab 04 as shown in user screenshot
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0) // 0 to 100% for active tab line
  const [activeDot, setActiveDot] = useState({ row: 3, col: 7 })

  const autoPlayRef = useRef(null)
  const duration = 5000 // 5 seconds per tab

  // ── Auto advance tabs with progress bar ─────────────────────────
  useEffect(() => {
    if (!isPlaying) return

    const intervalTime = 50
    const step = (intervalTime / duration) * 100

    autoPlayRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveTabIdx(current => (current + 1) % TABS.length)
          return 0
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(autoPlayRef.current)
  }, [isPlaying, activeTabIdx])

  const handleSelectTab = (idx) => {
    setActiveTabIdx(idx)
    setProgress(0)
  }

  const togglePlay = () => {
    setIsPlaying(p => !p)
  }

  const activeTab = TABS[activeTabIdx]

  return (
    <div className="cr-showcase-wrap">
      {/* ── Tabs Bar with Progress Timer Lines ────────────────── */}
      <div className="cr-tabs-bar">
        {TABS.map((tab, idx) => {
          const isActive = idx === activeTabIdx
          return (
            <button
              key={tab.id}
              className={`cr-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectTab(idx)}
            >
              <div className="cr-tab-label">
                <span className="cr-tab-num">{tab.num}</span>
                <span className="cr-tab-title">{isActive ? tab.full : tab.short}</span>
              </div>
              {/* Animated Progress Timer Line */}
              <div className="cr-tab-timer-track">
                <div
                  className="cr-tab-timer-fill"
                  style={{
                    width: isActive ? `${progress}%` : '0%',
                    transition: isActive ? 'width 0.05s linear' : 'none',
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Main Interactive Animated Showcase Card ──────────── */}
      <div className="cr-canvas-card">
        {/* Top Status Header */}
        <div className="cr-card-header">
          <div className="cr-header-left">
            <span className="cr-tag-label">{activeTab.tag}</span>
            <div className="cr-status-row">
              <h3 className="cr-status-title">{activeTab.status}</h3>
              <div className="cr-scan-meta">
                <span className="cr-live-dot" style={{ backgroundColor: activeTab.statusColor }} />
                <span>{activeTab.subText}</span>
              </div>
            </div>
            {/* Animated Gradient Bar */}
            <div className="cr-header-bar-track">
              <div
                className="cr-header-bar-fill"
                style={{
                  width: `${activeTab.progress}%`,
                  background: `linear-gradient(90deg, #10B981 0%, #38BDF8 60%, ${activeTab.statusColor} 100%)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Body based on Active Tab */}
        <div className="cr-card-body">
          {/* TAB 04: RADAR SCANNER & MATRIX (Matches User Screenshot) */}
          {activeTabIdx === 3 && (
            <div className="cr-visual-grid-pane">
              {/* Radar Matrix Grid (18 cols x 7 rows) */}
              <div className="cr-matrix-grid">
                {/* Animated Vertical Sweep Scanner Line */}
                <div className="cr-scanline" />

                {Array.from({ length: 7 }).map((_, row) => (
                  <div key={row} className="cr-matrix-row">
                    {Array.from({ length: 18 }).map((_, col) => {
                      const isHighlighted = row === activeDot.row && col === activeDot.col
                      const isAmber = (row === 2 && col === 9) || (row === 4 && col === 14) || (row === 1 && col === 4)
                      const isRed = (row === 5 && col === 12)
                      let dotClass = 'cr-dot green'
                      if (isRed) dotClass = 'cr-dot red'
                      else if (isAmber) dotClass = 'cr-dot amber'
                      if (isHighlighted) dotClass += ' pulse'

                      return (
                        <div
                          key={col}
                          className={dotClass}
                          onClick={() => setActiveDot({ row, col })}
                          title={`Line ${row * 18 + col + 1}: Verified`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Floating Insight Tooltip Card (CodeRabbit style) */}
              <div className="cr-floating-insight">
                <div className="cr-insight-top">
                  <div className="cr-insight-title-row">
                    <span className="cr-insight-icon">●</span>
                    <span className="cr-insight-title">Section 80CCD(1B) NPS Gap</span>
                  </div>
                  <span className="cr-badge-high">High Value</span>
                </div>
                <div className="cr-insight-desc">
                  ax_deduct · GHSA-4w2v-qz35-vp99
                </div>
                <div className="cr-insight-foot">
                  <span className="cr-insight-detected">Detected on Salary slip</span>
                  <span className="cr-insight-fix">Save ₹15,600 ready</span>
                </div>
              </div>

              {/* Animated Doughnut Chart Card (Right Side) */}
              <div className="cr-doughnut-card">
                <div className="cr-doughnut-header">
                  <span className="cr-doughnut-title">Deduction distribution</span>
                  <span className="cr-doughnut-sub">AI Deep Scan &amp; Deductions</span>
                </div>

                <div className="cr-doughnut-graphic">
                  <svg viewBox="0 0 120 120" width="120" height="120">
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="12"
                    />
                    {/* 80C Segment (Green) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="12"
                      strokeDasharray="180 300"
                      strokeDashoffset="75"
                      className="cr-chart-circle"
                    />
                    {/* HRA Segment (Cyan) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke="#38BDF8"
                      strokeWidth="12"
                      strokeDasharray="60 300"
                      strokeDashoffset="260"
                      className="cr-chart-circle"
                    />
                    {/* NPS Segment (Amber) */}
                    <circle
                      cx="60"
                      cy="60"
                      r="46"
                      fill="transparent"
                      stroke="#F59E0B"
                      strokeWidth="12"
                      strokeDasharray="35 300"
                      strokeDashoffset="325"
                      className="cr-chart-circle"
                    />
                  </svg>
                  <div className="cr-doughnut-center">
                    <span className="cr-doughnut-count">₹1,99,000</span>
                    <span className="cr-doughnut-unit">deductions</span>
                  </div>
                </div>

                <div className="cr-doughnut-legend">
                  <div className="cr-legend-item">
                    <span className="cr-leg-dot red" /> <span>Critical: 2%</span>
                  </div>
                  <div className="cr-legend-item">
                    <span className="cr-leg-dot amber" /> <span>High: 12%</span>
                  </div>
                  <div className="cr-legend-item">
                    <span className="cr-leg-dot cyan" /> <span>HRA: 40%</span>
                  </div>
                  <div className="cr-legend-item">
                    <span className="cr-leg-dot green" /> <span>80C: 46%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 01: PARSE (Form 16 Ingestion Stream) */}
          {activeTabIdx === 0 && (
            <div className="cr-parse-pane">
              <div className="cr-code-card">
                <div className="cr-code-header">
                  <span className="cr-code-tag">FORM 16 PARSER</span>
                  <span className="cr-code-file">Part_A_B_AY2025-26.pdf</span>
                </div>
                <div className="cr-code-content">
                  <div className="cr-code-line"><span className="c-dim">01</span> <span className="c-key">Employer:</span> Tata Consultancy Services Ltd. (TAN: CHEA01928B)</div>
                  <div className="cr-code-line"><span className="c-dim">02</span> <span className="c-key">Gross_Salary:</span> <span className="c-val">₹14,80,000</span> <span className="c-tag">VERIFIED</span></div>
                  <div className="cr-code-line"><span className="c-dim">03</span> <span className="c-key">Section_10_HRA:</span> <span className="c-val">₹1,84,000</span> <span className="c-tag">VERIFIED</span></div>
                  <div className="cr-code-line"><span className="c-dim">04</span> <span className="c-key">Standard_Deduction:</span> <span className="c-val">₹75,000</span> <span className="c-tag">NEW REGIME UPDATED</span></div>
                  <div className="cr-code-line"><span className="c-dim">05</span> <span className="c-key">Section_80C_EPF_ELSS:</span> <span className="c-val">₹1,50,000</span> <span className="c-tag">CAPPED</span></div>
                  <div className="cr-code-line"><span className="c-dim">06</span> <span className="c-key">TDS_Deducted_24Q:</span> <span className="c-val">₹1,18,400</span> <span className="c-match">✓ MATCHES 26AS</span></div>
                </div>
              </div>

              <div className="cr-parse-summary">
                <div className="cr-metric-box">
                  <span className="cr-metric-num">3.2s</span>
                  <span className="cr-metric-lbl">OCR Extraction Time</span>
                </div>
                <div className="cr-metric-box">
                  <span className="cr-metric-num">99.8%</span>
                  <span className="cr-metric-lbl">PAN &amp; TDS Match Rate</span>
                </div>
                <div className="cr-metric-box">
                  <span className="cr-metric-num">₹0</span>
                  <span className="cr-metric-lbl">Manual Data Entry Required</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 02: PRIORITIZE (Transaction Triage) */}
          {activeTabIdx === 1 && (
            <div className="cr-triage-pane">
              <div className="cr-triage-list">
                <div className="cr-triage-row p0">
                  <span className="cr-p-badge p0">P0</span>
                  <div className="cr-triage-info">
                    <span className="cr-triage-name">Freelance Consultancy Credit (Upwork Escrow Inc)</span>
                    <span className="cr-triage-desc">Recurring ₹1,20,000/mo. Eligible for Section 44ADA 50% presumptive rate.</span>
                  </div>
                  <span className="cr-triage-impact">+₹72,000 Save</span>
                </div>

                <div className="cr-triage-row p1">
                  <span className="cr-p-badge p1">P1</span>
                  <div className="cr-triage-info">
                    <span className="cr-triage-name">Rental Deposit Return vs Rental Income</span>
                    <span className="cr-triage-desc">Classified as capital transfer — zero taxable event.</span>
                  </div>
                  <span className="cr-triage-impact">0 Tax Risk</span>
                </div>

                <div className="cr-triage-row p2">
                  <span className="cr-p-badge p2">P2</span>
                  <div className="cr-triage-info">
                    <span className="cr-triage-name">Dividend Credits from Zerodha Demat</span>
                    <span className="cr-triage-desc">₹18,400 auto-mapped to Income From Other Sources (Schedule OS).</span>
                  </div>
                  <span className="cr-triage-impact">Auto-reconciled</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 03: UNDERSTAND (Regime Optimizer) */}
          {activeTabIdx === 2 && (
            <div className="cr-regime-pane">
              <div className="cr-regime-col old">
                <span className="cr-reg-pill">Old Regime</span>
                <span className="cr-reg-amt">₹1,42,800</span>
                <span className="cr-reg-sub">with ₹3.25L deductions</span>
                <div className="cr-reg-bar old" style={{ width: '85%' }} />
              </div>

              <div className="cr-vs-badge">VS</div>

              <div className="cr-regime-col new active">
                <span className="cr-reg-pill green">New Regime (Winner)</span>
                <span className="cr-reg-amt win">₹88,600</span>
                <span className="cr-reg-sub">Standard deduction ₹75,000</span>
                <div className="cr-reg-bar new" style={{ width: '52%' }} />
                <span className="cr-winner-callout">✓ Save ₹54,200 annually</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Play / Pause Toggle Button */}
        <div className="cr-card-footer">
          <button
            type="button"
            className="cr-play-btn"
            onClick={togglePlay}
            title={isPlaying ? 'Pause auto-slider' : 'Play auto-slider'}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
