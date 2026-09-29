import React, { useState, useMemo } from 'react'
import './TaxConstellationOrb.css'

// Cluster visual themes
const CLUSTER_THEMES = [
  {
    name: 'Form 16 & TDS',
    primary: '#10B981', // Emerald
    glow: 'rgba(16, 185, 129, 0.4)',
    ring: '#10B981',
    accentText: 'Salary & TDS Mesh Active'
  },
  {
    name: 'Bank Statement',
    primary: '#38BDF8', // Sky Blue
    glow: 'rgba(56, 189, 248, 0.4)',
    ring: '#38BDF8',
    accentText: 'Interest & Cashflow Ledger Active'
  },
  {
    name: 'Capital Gains',
    primary: '#FB923C', // Coral/Amber
    glow: 'rgba(251, 146, 60, 0.4)',
    ring: '#FB923C',
    accentText: '112A/111A Portfolio Lattices Active'
  },
  {
    name: 'Your Own Answers',
    primary: '#C084FC', // Violet
    glow: 'rgba(192, 132, 252, 0.4)',
    ring: '#C084FC',
    accentText: 'Personal Exemption Nodes Active'
  },
  {
    name: 'The Tax Engine',
    primary: '#2DD4BF', // Mint
    glow: 'rgba(45, 212, 191, 0.4)',
    ring: '#2DD4BF',
    accentText: 'Deterministic Math Verification Active'
  },
  {
    name: 'Chartered Accountant',
    primary: '#FBBF24', // Gold
    glow: 'rgba(251, 191, 36, 0.45)',
    ring: '#FBBF24',
    accentText: 'CA Forensic Audit Signoff Active'
  }
]

// 92 curated nodes across the 6 clusters mirroring the CodeRabbit constellation
const NODES_DATA = [
  // ── CLUSTER 0: Form 16 & TDS (Upper-Left / Left) ──
  { id: 'f1', c: 0, x: 135, y: 155, r: 4.5, label: 'Form 16 Part-A', isHub: true },
  { id: 'f2', c: 0, x: 110, y: 190, r: 4.0, label: 'TAN Match (Sec 203)' },
  { id: 'f3', c: 0, x: 95, y: 145, r: 3.5, label: 'Standard Deduction ₹75k' },
  { id: 'f4', c: 0, x: 145, y: 115, r: 3.8, label: 'Sec 10(13A) HRA Exemption' },
  { id: 'f5', c: 0, x: 80, y: 225, r: 3.5, label: 'Employer TDS Deposited' },
  { id: 'f6', c: 0, x: 105, y: 265, r: 4.2, label: 'Form 16 Part-B (Dual Employer)', isHub: true },
  { id: 'f7', c: 0, x: 135, y: 230, r: 3.5, label: 'Leave Travel Concession' },
  { id: 'f8', c: 0, x: 165, y: 175, r: 3.8, label: 'PF & VPF Deduction' },
  { id: 'f9', c: 0, x: 70, y: 180, r: 3.2, label: '26AS Part-I Verification' },
  { id: 'f10', c: 0, x: 120, y: 85, r: 3.5, label: 'Professional Tax u/s 16' },
  { id: 'f11', c: 0, x: 155, y: 80, r: 3.2, label: 'Perquisites Sec 17(2)' },
  { id: 'f12', c: 0, x: 60, y: 250, r: 3.0, label: 'Challan Serial Validation' },
  { id: 'f13', c: 0, x: 95, y: 300, r: 3.4, label: 'Mid-Year Job Switch Overlap' },
  { id: 'f14', c: 0, x: 140, y: 280, r: 3.6, label: 'Section 89 Relief (Arrears)' },
  { id: 'f15', c: 0, x: 175, y: 220, r: 3.4, label: 'NPS Tier-1 Employer (80CCD2)' },

  // ── CLUSTER 1: Bank Statements (Top / Upper-Right) ──
  { id: 'b1', c: 1, x: 235, y: 80, r: 4.5, label: 'Savings Interest Aggregation', isHub: true },
  { id: 'b2', c: 1, x: 275, y: 70, r: 3.8, label: 'Section 80TTA Limit (₹10k)' },
  { id: 'b3', c: 1, x: 315, y: 85, r: 3.5, label: 'Section 80TTB Senior Citizen' },
  { id: 'b4', c: 1, x: 250, y: 115, r: 4.0, label: 'Fixed Deposit Accrued Interest', isHub: true },
  { id: 'b5', c: 1, x: 290, y: 120, r: 3.5, label: 'TDS on FD (Section 194A)' },
  { id: 'b6', c: 1, x: 345, y: 110, r: 3.2, label: 'Form 15G / 15H Validation' },
  { id: 'b7', c: 1, x: 215, y: 125, r: 3.6, label: 'Dividend Credits Reconciliation' },
  { id: 'b8', c: 1, x: 330, y: 150, r: 3.8, label: 'AIS High-Value Cash Outward' },
  { id: 'b9', c: 1, x: 370, y: 135, r: 3.2, label: 'TDS on Dividend (Sec 194)' },
  { id: 'b10', c: 1, x: 270, y: 155, r: 3.5, label: 'Foreign Inward Remittance (FIRC)' },
  { id: 'b11', c: 1, x: 195, y: 95, r: 3.2, label: 'Recurring Deposit Interest' },
  { id: 'b12', c: 1, x: 310, y: 180, r: 3.4, label: 'UPI Business vs Personal Audit' },
  { id: 'b13', c: 1, x: 385, y: 175, r: 3.0, label: 'Credit Card Spend > ₹10L SFT' },
  { id: 'b14', c: 1, x: 230, y: 160, r: 3.6, label: 'Escrow Account Yield' },

  // ── CLUSTER 2: Capital Gains (Mid-Right / Lower-Right) ──
  { id: 'g1', c: 2, x: 380, y: 220, r: 4.5, label: 'Zerodha / Demat Statement', isHub: true },
  { id: 'g2', c: 2, x: 420, y: 245, r: 3.5, label: 'STCG u/s 111A (20% Rate)' },
  { id: 'g3', c: 2, x: 360, y: 260, r: 4.2, label: 'LTCG u/s 112A (12.5% Rate)', isHub: true },
  { id: 'g4', c: 2, x: 405, y: 285, r: 3.8, label: '₹1.25L Exemption u/s 112A' },
  { id: 'g5', c: 2, x: 345, y: 300, r: 3.5, label: 'Jan-2018 FMV Grandfathering' },
  { id: 'g6', c: 2, x: 425, y: 320, r: 3.2, label: 'Mutual Fund AMC CAS Ingestion' },
  { id: 'g7', c: 2, x: 385, y: 345, r: 3.8, label: 'Loss Set-Off & 8-Yr Carry Fwd', isHub: true },
  { id: 'g8', c: 2, x: 350, y: 360, r: 3.5, label: 'Intraday Speculative u/s 43(5)' },
  { id: 'g9', c: 2, x: 310, y: 330, r: 3.6, label: 'F&O Derivative Turnover Test' },
  { id: 'g10', c: 2, x: 410, y: 375, r: 3.0, label: 'Debt Funds Purchase Pre-2023' },
  { id: 'g11', c: 2, x: 370, y: 395, r: 3.4, label: 'RSU / Foreign Stock ESPP' },
  { id: 'g12', c: 2, x: 435, y: 280, r: 3.2, label: 'Securities Transaction Tax (STT)' },
  { id: 'g13', c: 2, x: 325, y: 275, r: 3.4, label: 'Sovereign Gold Bond Redemption' },
  { id: 'g14', c: 2, x: 440, y: 350, r: 3.0, label: 'Section 54EC Capital Gains Bonds' },

  // ── CLUSTER 3: Your Own Answers (Bottom / Lower-Center) ──
  { id: 'a1', c: 3, x: 260, y: 390, r: 4.5, label: 'Rent Paid & Landlord PAN', isHub: true },
  { id: 'a2', c: 3, x: 295, y: 415, r: 3.5, label: 'Section 80GG Rent Without HRA' },
  { id: 'a3', c: 3, x: 220, y: 410, r: 4.0, label: 'Residency 182-Day Physical Test' },
  { id: 'a4', c: 3, x: 320, y: 380, r: 3.6, label: 'Section 80D Health Parents > 60' },
  { id: 'a5', c: 3, x: 245, y: 355, r: 3.8, label: 'Home Loan Interest 24(b) ₹2L', isHub: true },
  { id: 'a6', c: 3, x: 280, y: 345, r: 3.4, label: 'Section 80E Education Loan' },
  { id: 'a7', c: 3, x: 195, y: 380, r: 3.5, label: 'Section 80CCD(1B) NPS ₹50,000' },
  { id: 'a8', c: 3, x: 225, y: 440, r: 3.2, label: 'Section 80G 100% Tax Exemption' },
  { id: 'a9', c: 3, x: 270, y: 445, r: 3.0, label: 'Section 80EEB EV Loan Interest' },
  { id: 'a10', c: 3, x: 310, y: 430, r: 3.2, label: 'Section 80U Disability Claim' },
  { id: 'a11', c: 3, x: 175, y: 415, r: 3.0, label: 'Co-Owner Property Allocation' },
  { id: 'a12', c: 3, x: 160, y: 360, r: 3.4, label: 'Minor Child Income Exemption' },
  { id: 'a13', c: 3, x: 335, y: 415, r: 3.0, label: 'Political Party Donation 80GGC' },

  // ── CLUSTER 4: The Tax Engine (Bottom-Left / Mid-Left) ──
  { id: 'e1', c: 4, x: 105, y: 350, r: 4.5, label: 'Dual-Regime Simulator', isHub: true },
  { id: 'e2', c: 4, x: 70, y: 380, r: 3.8, label: 'New vs Old Regime Net Spread' },
  { id: 'e3', c: 4, x: 135, y: 390, r: 3.5, label: 'Section 87A Full Rebate ₹7L/₹12L' },
  { id: 'e4', c: 4, x: 110, y: 415, r: 3.5, label: 'Marginal Relief Edge Boundary' },
  { id: 'e5', c: 4, x: 65, y: 320, r: 3.4, label: '134 Deterministic PyTest Matrix', isHub: true },
  { id: 'e6', c: 4, x: 145, y: 330, r: 3.6, label: 'Surcharge Tier Calculator' },
  { id: 'e7', c: 4, x: 45, y: 350, r: 3.0, label: 'Health & Education Cess 4%' },
  { id: 'e8', c: 4, x: 75, y: 430, r: 3.0, label: 'Advance Tax 234B/234C Interest' },
  { id: 'e9', c: 4, x: 130, y: 435, r: 3.2, label: 'Late Filing Fee 234F Check' },
  { id: 'e10', c: 4, x: 50, y: 290, r: 3.2, label: 'Carry Forward Loss Ledger' },
  { id: 'e11', c: 4, x: 80, y: 115, r: 3.0, label: 'Rounding off Sec 288A/B' },
  { id: 'e12', c: 4, x: 160, y: 420, r: 3.2, label: 'ITR-1 vs ITR-2 Eligibility Flag' },

  // ── CLUSTER 5: Chartered Accountant & Center Hub (Central Core) ──
  { id: 'c1', c: 5, x: 250, y: 250, r: 6.5, label: 'Taxly Reconciled Return (Core)', isHub: true },
  { id: 'c2', c: 5, x: 215, y: 210, r: 4.2, label: 'CA High-Value Mismatch Review', isHub: true },
  { id: 'c3', c: 5, x: 285, y: 215, r: 4.0, label: 'Notice Risk Assessment Score' },
  { id: 'c4', c: 5, x: 275, y: 280, r: 4.2, label: 'Schedule FA Foreign Asset Audit', isHub: true },
  { id: 'c5', c: 5, x: 205, y: 270, r: 3.8, label: 'Section 143(1) Intimation Match' },
  { id: 'c6', c: 5, x: 250, y: 195, r: 3.6, label: 'TIS vs 26AS Discrepancy Gate' },
  { id: 'c7', c: 5, x: 185, y: 235, r: 3.5, label: 'Crypto & VDA 30% Compliance' },
  { id: 'c8', c: 5, x: 305, y: 245, r: 3.5, label: 'e-Verification JSON Signed' },
  { id: 'c9', c: 5, x: 240, y: 305, r: 3.5, label: 'Chartered Accountant Final Seal' },
  { id: 'c10', c: 5, x: 220, y: 170, r: 3.2, label: 'Audit Trail Timestamped' }
]

// Intricate network links (both intra-cluster meshes and inter-cluster bridges)
const EDGES_DATA = [
  // Cluster 0 (Form 16) mesh
  ['f1', 'f2'], ['f1', 'f3'], ['f1', 'f4'], ['f1', 'f8'], ['f2', 'f5'],
  ['f2', 'f9'], ['f3', 'f10'], ['f4', 'f11'], ['f5', 'f6'], ['f6', 'f7'],
  ['f6', 'f12'], ['f6', 'f13'], ['f7', 'f14'], ['f8', 'f15'], ['f9', 'f12'],
  ['f10', 'f11'], ['f13', 'f14'], ['f14', 'f15'], ['f1', 'f7'], ['f3', 'f8'],

  // Cluster 1 (Bank) mesh
  ['b1', 'b2'], ['b1', 'b4'], ['b1', 'b7'], ['b1', 'b11'], ['b2', 'b3'],
  ['b4', 'b5'], ['b4', 'b8'], ['b5', 'b6'], ['b5', 'b9'], ['b7', 'b10'],
  ['b7', 'b14'], ['b8', 'b12'], ['b8', 'b13'], ['b10', 'b14'], ['b12', 'b14'],
  ['b2', 'b5'], ['b4', 'b7'], ['b3', 'b6'],

  // Cluster 2 (Capital Gains) mesh
  ['g1', 'g2'], ['g1', 'g3'], ['g1', 'g6'], ['g2', 'g12'], ['g3', 'g4'],
  ['g3', 'g5'], ['g3', 'g7'], ['g4', 'g5'], ['g5', 'g9'], ['g6', 'g7'],
  ['g7', 'g8'], ['g7', 'g11'], ['g8', 'g9'], ['g7', 'g10'], ['g10', 'g14'],
  ['g9', 'g13'], ['g1', 'g13'], ['g6', 'g12'],

  // Cluster 3 (Answers) mesh
  ['a1', 'a2'], ['a1', 'a4'], ['a1', 'a5'], ['a2', 'a13'], ['a3', 'a5'],
  ['a3', 'a7'], ['a3', 'a8'], ['a4', 'a6'], ['a5', 'a6'], ['a5', 'a7'],
  ['a7', 'a11'], ['a7', 'a12'], ['a8', 'a9'], ['a8', 'a10'], ['a9', 'a10'],
  ['a1', 'a3'], ['a4', 'a10'], ['a6', 'a7'],

  // Cluster 4 (Engine) mesh
  ['e1', 'e2'], ['e1', 'e3'], ['e1', 'e6'], ['e1', 'e5'], ['e2', 'e4'],
  ['e3', 'e4'], ['e3', 'e8'], ['e4', 'e9'], ['e5', 'e7'], ['e5', 'e10'],
  ['e6', 'e7'], ['e6', 'e12'], ['e8', 'e9'], ['e10', 'e12'], ['e5', 'e11'],
  ['e2', 'e5'], ['e3', 'e6'],

  // Cluster 5 (CA & Core) mesh
  ['c1', 'c2'], ['c1', 'c3'], ['c1', 'c4'], ['c1', 'c5'], ['c1', 'c6'],
  ['c2', 'c6'], ['c2', 'c7'], ['c2', 'c10'], ['c3', 'c4'], ['c3', 'c8'],
  ['c4', 'c9'], ['c5', 'c7'], ['c5', 'c9'], ['c6', 'c10'], ['c8', 'c9'],

  // Cross-cluster bridge lines to Core Hub
  ['f1', 'c2'], ['f6', 'c5'], ['f8', 'c1'],
  ['b4', 'c6'], ['b7', 'c1'], ['b10', 'c3'],
  ['g1', 'c3'], ['g3', 'c1'], ['g7', 'c4'],
  ['a1', 'c1'], ['a5', 'c5'], ['a7', 'c9'],
  ['e1', 'c1'], ['e5', 'c2'], ['e6', 'c4'],

  // Outer cluster-to-cluster perimeter transitions
  ['f11', 'b11'], ['f4', 'b1'], ['f14', 'e1'], ['f7', 'e5'],
  ['b3', 'g1'], ['b9', 'g2'], ['b12', 'g13'],
  ['g8', 'a4'], ['g11', 'a1'], ['g9', 'a5'],
  ['a7', 'e1'], ['a12', 'e6'], ['a5', 'e4']
]

export default function TaxConstellationOrb({ activeIdx = 0, onSelectNode }) {
  const [hoveredNode, setHoveredNode] = useState(null)
  const currentTheme = CLUSTER_THEMES[activeIdx] || CLUSTER_THEMES[0]

  // Map nodes to lookup dictionary for SVG rendering
  const nodeMap = useMemo(() => {
    const map = {}
    NODES_DATA.forEach(n => { map[n.id] = n })
    return map
  }, [])

  return (
    <div className="cr-constellation-wrap">
      {/* Dynamic ambient background glow that shifts with active cluster */}
      <div
        className="cr-constellation-ambient"
        style={{
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${currentTheme.glow}, transparent 72%)`
        }}
      />

      <svg
        className="cr-constellation-svg"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glowing node filter */}
          <filter id="crGlowActive" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dynamic ring gradient */}
          <linearGradient id="crRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.primary} stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.7" />
            <stop offset="100%" stopColor={currentTheme.primary} stopOpacity="0.3" />
          </linearGradient>

          {/* Radial mask for soft fade at border */}
          <radialGradient id="crSphereMask" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── CONCENTRIC ROTATING OUTER RINGS (Exactly matching CodeRabbit) ── */}
        {/* Outer glowing solid perimeter ring */}
        <circle
          className="cr-outer-boundary"
          cx="250"
          cy="250"
          r="234"
          stroke={currentTheme.primary}
          strokeWidth="2.5"
          opacity="0.85"
        />

        {/* Middle dashed emerald/cyan rotating ring (Clockwise) */}
        <circle
          className="cr-middle-dashed-ring"
          cx="250"
          cy="250"
          r="224"
          stroke="#10B981"
          strokeWidth="1.4"
          strokeDasharray="5 7"
          opacity="0.65"
        />

        {/* Inner dashed lavender/violet counter-rotating ring */}
        <circle
          className="cr-inner-dashed-ring"
          cx="250"
          cy="250"
          r="214"
          stroke="#818CF8"
          strokeWidth="1.2"
          strokeDasharray="4 6"
          opacity="0.5"
        />

        {/* ── NETWORK EDGES / MESH ── */}
        <g className="cr-edges-group">
          {EDGES_DATA.map(([fromId, toId], idx) => {
            const from = nodeMap[fromId]
            const to = nodeMap[toId]
            if (!from || !to) return null

            const isCurrentClusterEdge = (from.c === activeIdx && to.c === activeIdx)
            const isBridgeToActive = (from.c === activeIdx && to.c === 5) || (to.c === activeIdx && from.c === 5)
            const isActive = isCurrentClusterEdge || isBridgeToActive

            let strokeColor = 'rgba(255, 255, 255, 0.07)'
            let strokeWidth = 0.8
            let strokeOpacity = 0.6

            if (isActive) {
              strokeColor = currentTheme.primary
              strokeWidth = 1.6
              strokeOpacity = 0.85
            } else if (from.c === activeIdx || to.c === activeIdx) {
              strokeColor = currentTheme.primary
              strokeWidth = 1.1
              strokeOpacity = 0.4
            }

            return (
              <line
                key={`edge-${idx}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                className={isActive ? 'cr-edge-active' : 'cr-edge-idle'}
              />
            )
          })}
        </g>

        {/* ── CONSTELLATION NODES ── */}
        <g className="cr-nodes-group">
          {NODES_DATA.map(node => {
            const isSelectedCluster = (node.c === activeIdx)
            const isCoreHub = (node.id === 'c1')
            const isCaHub = (node.c === 5)
            const isHovered = (hoveredNode?.id === node.id)

            // Dynamic node coloring
            let fill = 'rgba(255, 255, 255, 0.12)'
            let stroke = 'rgba(255, 255, 255, 0.28)'
            let radius = node.r
            let extraFilter = null

            if (isCoreHub) {
              fill = isSelectedCluster || activeIdx === 5 ? '#FBBF24' : '#10B981'
              stroke = '#FFFFFF'
              radius = 8
              extraFilter = 'url(#crGlowActive)'
            } else if (isSelectedCluster) {
              fill = currentTheme.primary
              stroke = '#FFFFFF'
              radius = node.isHub ? node.r + 2.0 : node.r + 1.0
              extraFilter = 'url(#crGlowActive)'
            } else if (isCaHub && activeIdx !== 5) {
              fill = 'rgba(251, 191, 36, 0.3)'
              stroke = 'rgba(251, 191, 36, 0.6)'
              radius = node.r
            }

            if (isHovered) {
              radius += 2.5
              stroke = '#38BDF8'
            }

            return (
              <g
                key={node.id}
                className={`cr-node-item ${isSelectedCluster ? 'cr-node-active' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectNode && onSelectNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node halo ring for active hubs */}
                {isSelectedCluster && node.isHub && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius + 4}
                    fill="none"
                    stroke={currentTheme.primary}
                    strokeWidth="1"
                    opacity="0.5"
                    className="cr-node-pulse-ring"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelectedCluster ? 1.5 : 1}
                  filter={extraFilter || undefined}
                />
              </g>
            )
          })}
        </g>

        {/* ── CENTER CORE BADGE (Taxly Reconciled Return) ── */}
        <g transform="translate(250, 250)" className="cr-center-hub">
          <circle
            r="26"
            fill="rgba(11, 15, 23, 0.92)"
            stroke={currentTheme.primary}
            strokeWidth="1.5"
            className="cr-center-pulse"
          />
          <text
            y="-2"
            textAnchor="middle"
            fill="#FFFFFF"
            style={{
              fontFamily: "'Inter Tight', var(--font-heading, sans-serif)",
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}
          >
            T
          </text>
          <text
            y="11"
            textAnchor="middle"
            fill={currentTheme.primary}
            style={{
              fontFamily: 'var(--mono, monospace)',
              fontSize: '6.5px',
              fontWeight: 600,
              letterSpacing: '0.12em'
            }}
          >
            RETURN
          </text>
        </g>
      </svg>

      {/* ── INTERACTIVE HOVER FLOATING TOOLTIP ── */}
      {hoveredNode && (
        <div
          className="cr-node-tooltip"
          style={{
            left: `${(hoveredNode.x / 500) * 100}%`,
            top: `${(hoveredNode.y / 500) * 100}%`
          }}
        >
          <span className="cr-tt-cat">{CLUSTER_THEMES[hoveredNode.c].name}</span>
          <span className="cr-tt-label">{hoveredNode.label}</span>
        </div>
      )}

      {/* ── BOTTOM HUD STATUS BAR ── */}
      <div className="cr-constellation-hud">
        <div className="cr-hud-pill">
          <span className="cr-hud-dot" style={{ background: currentTheme.primary }} />
          <span className="cr-hud-tag">{currentTheme.accentText}</span>
        </div>
        <div className="cr-hud-stats">
          <span><b>92</b> NODES RECONCILED</span>
          <span className="cr-hud-sep">/</span>
          <span><b>100%</b> AUDIT READY</span>
        </div>
      </div>
    </div>
  )
}
