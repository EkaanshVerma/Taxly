import React, { useState, useMemo } from 'react'
import './TrustedContextShowcase.css'

export const CONTEXT_TABS = [
  {
    id: 'codegraph',
    title: 'Codegraph',
    desc: 'Builds a deterministic map of every possible node affected by the change.'
  },
  {
    id: 'adaptive-systems',
    title: 'Adaptive systems',
    desc: 'Gathers related history, docs, and context for how your team works in the codebase.'
  },
  {
    id: 'business-context',
    title: 'Business context',
    desc: 'Brings in context from PRDs, issues, and internal docs relevant to the work.'
  },
  {
    id: 'review-generation',
    title: 'Review generation',
    desc: 'Uses agentic code generation and exploration, static verification, and analysis to deliver a review.'
  },
  {
    id: 'ensemble-of-models',
    title: 'Ensemble of models & tools',
    desc: 'Brings together multiple models to solve difficult problems, playing to their relative strengths.'
  }
]

// Models list for Stage 5
const ENSEMBLE_MODELS = [
  { text: 'GPT-5.1 · effort: high', dot: '#5c6eff' },
  { text: 'Claude Opus 5 · effort: low', dot: '#5c6eff' },
  { text: 'Claude Sonnet 5 · effort: low', dot: '#5c6eff' },
  { text: 'Gemini 3.5 Flash · thinking: high', dot: '#5c6eff' },
  { text: 'Grok 4.5 · reasoning', dot: '#5c6eff' }
]

// Tools list for Stage 5
const ENSEMBLE_TOOLS = [
  { text: 'Knowledge Base', dot: '#71feac', color: '#71feac' },
  { text: 'CVEs/sec disclosures', dot: '#6e7681', color: '#8b949e' },
  { text: 'Validators', dot: '#6e7681', color: '#8b949e' },
  { text: 'SAST', dot: '#71feac', color: '#71feac' },
  { text: 'linters', dot: '#6e7681', color: '#8b949e' }
]

// Adaptive Systems pills (Stage 1)
const ADAPTIVE_PILLS = [
  { text: 'Codebase Systems', solid: true },
  { text: 'Configurations', solid: false },
  { text: 'History', solid: false },
  { text: 'Learnings', solid: false },
  { text: 'Knowledge Base', solid: false }
]

// Business Context pills (Stage 2)
const BUSINESS_PILLS = [
  { text: 'Business', solid: true },
  { text: 'Tracked Issues', solid: false },
  { text: 'PRDs, Docs, etc.', solid: false },
  { text: 'Concerns / Security', solid: false },
  { text: 'Priorities', solid: false }
]

export default function TrustedContextShowcase({ initialTab = 4 }) {
  const [activeTab, setActiveTab] = useState(initialTab) // Default to Stage 4 (Ensemble of models & tools as shown in user screenshot)

  // Semicircular constellation nodes distributed within radius 170 (x >= 8, x^2 + y^2 < 170^2)
  const { semiNodes, semiEdges } = useMemo(() => {
    const rawNodes = [
      // Outer border nodes
      [15, -165], [45, -155], [85, -140], [125, -110], [150, -75], [165, -35],
      [168, 5], [162, 45], [145, 85], [120, 120], [80, 148], [40, 160], [15, 168],
      // Mid arc nodes
      [25, -125], [65, -110], [105, -80], [125, -40], [130, 0], [125, 40], [105, 80], [65, 110], [25, 125],
      // Inner nodes
      [15, -85], [45, -70], [80, -45], [95, -10], [90, 30], [75, 65], [45, 75], [15, 85],
      // Core nodes
      [20, -40], [50, -25], [65, 0], [55, 25], [20, 45],
      // Near divider axis
      [12, -10], [12, 15], [30, 5], [38, -50], [42, 50], [82, 10], [110, -15], [140, 15]
    ]

    const nodesList = rawNodes.map((pt, i) => ({
      id: `sn-${i}`,
      x: pt[0],
      y: pt[1],
      r: i % 7 === 0 ? 3.5 : (i % 3 === 0 ? 2.8 : 2),
      isHub: i % 5 === 0
    }))

    const edgesList = []
    for (let i = 0; i < nodesList.length; i++) {
      for (let j = i + 1; j < nodesList.length; j++) {
        const dx = nodesList[i].x - nodesList[j].x
        const dy = nodesList[i].y - nodesList[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 46) {
          edgesList.push({
            id: `se-${i}-${j}`,
            x1: nodesList[i].x,
            y1: nodesList[i].y,
            x2: nodesList[j].x,
            y2: nodesList[j].y
          })
        }
      }
    }

    return { semiNodes: nodesList, semiEdges: edgesList }
  }, [])

  return (
    <div className="cr-showcase-container">
      {/* ── LEFT TABS LIST ── */}
      <div className="cr-showcase-tabs">
        {CONTEXT_TABS.map((tab, idx) => {
          const isActive = activeTab === idx
          return (
            <div
              key={tab.id}
              className={`cr-showcase-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTab(idx) }}
            >
              <div className="cr-tab-header">
                <span className="cr-tab-title">{tab.title}</span>
              </div>
              <div className={`cr-tab-desc-wrap ${isActive ? 'open' : ''}`}>
                <p className="cr-tab-desc">{tab.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── VERTICAL DIVIDING LINE (Orange accent indicator) ── */}
      <div className="cr-showcase-divider">
        <div
          className="cr-divider-indicator"
          style={{
            top: `${activeTab * 20}%`,
            height: '20%'
          }}
        />
      </div>

      {/* ── RIGHT VISUAL CANVAS STAGE ── */}
      <div className="cr-showcase-stage">
        {/* BACKGROUND AMBIENT GLOW */}
        <div className={`cr-stage-glow stage-${activeTab}`} />

        {/* ══ STAGE 0: CODEGRAPH ══ */}
        {activeTab === 0 && (
          <div className="cr-stage-content stage-codegraph">
            <svg viewBox="0 -220 540 440" className="cr-stage-svg">
              {/* Outer boundary ring */}
              <path d="M 0 -195 A 195 195 0 0 1 0 195" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              {/* Edges */}
              <g className="cr-edges">
                {semiEdges.map((e) => (
                  <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                ))}
              </g>
              {/* Nodes */}
              <g className="cr-nodes">
                {semiNodes.map((n) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={n.isHub ? '#FFFFFF' : 'rgba(255,255,255,0.35)'}
                  />
                ))}
              </g>
              {/* Central Active Change Node Badge */}
              <g transform="translate(65, 0)">
                <circle r="7" fill="#10B981" />
                <rect x="16" y="-13" width="94" height="26" rx="4" fill="#0C151D" stroke="#10B981" strokeWidth="1.5" />
                <text x="63" y="4" fill="#10B981" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="monospace">
                  +8 | 135-142
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* ══ STAGE 1: ADAPTIVE SYSTEMS ══ */}
        {activeTab === 1 && (
          <div className="cr-stage-content stage-adaptive">
            <svg viewBox="0 -220 540 440" className="cr-stage-svg">
              <path d="M 0 -190 A 190 190 0 0 1 0 190" fill="none" stroke="#7382FF" strokeWidth="1.5" strokeDasharray="6 6" />
              <g className="cr-edges">
                {semiEdges.map((e) => (
                  <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(115,130,255,0.2)" strokeWidth="1" />
                ))}
              </g>
              <g className="cr-nodes">
                {semiNodes.map((n) => (
                  <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={n.isHub ? '#7382FF' : 'rgba(115,130,255,0.4)'} />
                ))}
              </g>
            </svg>
            <div className="cr-docked-pills right">
              {ADAPTIVE_PILLS.map((p, i) => (
                <div key={i} className={`cr-dock-pill purple ${p.solid ? 'solid' : 'outlined'}`}>
                  {p.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STAGE 2: BUSINESS CONTEXT ══ */}
        {activeTab === 2 && (
          <div className="cr-stage-content stage-business">
            <svg viewBox="0 -220 540 440" className="cr-stage-svg">
              <path d="M 0 -190 A 190 190 0 0 1 0 190" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="6 6" />
              <g className="cr-edges">
                {semiEdges.map((e) => (
                  <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
                ))}
              </g>
              <g className="cr-nodes">
                {semiNodes.map((n) => (
                  <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={n.isHub ? '#10B981' : 'rgba(16,185,129,0.4)'} />
                ))}
              </g>
            </svg>
            <div className="cr-docked-pills right">
              {BUSINESS_PILLS.map((p, i) => (
                <div key={i} className={`cr-dock-pill green ${p.solid ? 'solid' : 'outlined'}`}>
                  {p.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STAGE 3: REVIEW GENERATION ══ */}
        {activeTab === 3 && (
          <div className="cr-stage-content stage-review-gen">
            <svg viewBox="0 -220 540 440" className="cr-stage-svg">
              <path d="M 0 -202 A 202 202 0 0 1 0 202" fill="none" stroke="#F04006" strokeWidth="2.5" filter="drop-shadow(0 0 8px rgba(240,64,6,0.6))" />
              <path d="M 0 -190 A 190 190 0 0 1 0 190" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="6 6" />
              <path d="M 0 -178 A 178 178 0 0 1 0 178" fill="none" stroke="#7382FF" strokeWidth="1.5" strokeDasharray="5 5" />
              <g className="cr-edges">
                {semiEdges.map((e) => (
                  <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                ))}
              </g>
              <g className="cr-nodes">
                {semiNodes.map((n) => (
                  <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill={n.y < 0 ? '#10B981' : '#7382FF'} />
                ))}
              </g>
            </svg>
          </div>
        )}

        {/* ══ STAGE 4: ENSEMBLE OF MODELS & TOOLS (HERO STATE IN USER SCREENSHOT) ══ */}
        {activeTab === 4 && (
          <div className="cr-stage-content stage-ensemble">
            {/* LEFT BISECTED ORBITAL GRAPH */}
            <div className="cr-ensemble-left">
              <svg viewBox="0 -230 480 460" className="cr-ensemble-svg">
                {/* Semicircular constellation network */}
                <g className="cr-edges">
                  {semiEdges.map((e) => (
                    <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                  ))}
                </g>
                <g className="cr-nodes">
                  {semiNodes.map((n) => (
                    <circle key={n.id} cx={n.x} cy={n.y} r={n.r} fill="rgba(255,255,255,0.22)" />
                  ))}
                </g>

                {/* Concentric orbital arcs */}
                {/* 1. Green dashed outer arc */}
                <path
                  d="M 0 -202 A 202 202 0 0 1 0 202"
                  fill="none"
                  stroke="#56E39F"
                  strokeWidth="1.4"
                  strokeDasharray="5 5"
                />

                {/* 2. Blue dashed inner arc */}
                <path
                  d="M 0 -188 A 188 188 0 0 1 0 188"
                  fill="none"
                  stroke="#7382FF"
                  strokeWidth="1.4"
                  strokeDasharray="5 5"
                />

                {/* 3. Glowing orange solid arc along the right flank */}
                <path
                  d="M 72 -156 A 172 172 0 0 1 72 156"
                  fill="none"
                  stroke="#F04006"
                  strokeWidth="3.2"
                  filter="drop-shadow(0 0 10px rgba(240, 64, 6, 0.75))"
                />

                {/* Orange horizontal connector arrow pointing from the orange arc to review section */}
                <g className="cr-arrow-pointer">
                  <line x1="172" y1="-18" x2="350" y2="-18" stroke="#F04006" strokeWidth="2" />
                  <polygon points="350,-22 360,-18 350,-14" fill="#F04006" />
                </g>
              </svg>

              {/* RADIATING MODELS & TOOLS LABELS LIST (Positioned right beside the orange arc) */}
              <div className="cr-arc-labels">
                {/* Blue Models group */}
                <div className="cr-labels-group models">
                  {ENSEMBLE_MODELS.map((m, i) => (
                    <div key={i} className="cr-arc-item model">
                      <span className="cr-dot" style={{ background: m.dot }} />
                      <span className="cr-text">{m.text}</span>
                    </div>
                  ))}
                </div>

                {/* Ellipsis separator */}
                <div className="cr-arc-ellipsis">...</div>

                {/* Green & Gray Tools group */}
                <div className="cr-labels-group tools">
                  {ENSEMBLE_TOOLS.map((t, i) => (
                    <div key={i} className="cr-arc-item tool">
                      <span className="cr-dot" style={{ background: t.dot }} />
                      <span className="cr-text" style={{ color: t.color }}>{t.text}</span>
                    </div>
                  ))}
                </div>

                <div className="cr-arc-ellipsis">...</div>
              </div>
            </div>

            {/* RIGHT SIDE: CODE DIFF & CODERABBIT REVIEW BOT CARD */}
            <div className="cr-ensemble-right">
              {/* CODE DIFF BOX */}
              <div className="cr-diff-card">
                <div className="cr-diff-lines">
                  <div className="cr-line"><span className="ln">135</span><span className="code"><span className="kw">stop</span>(): <span className="type">void</span> {'{'}</span></div>
                  <div className="cr-line"><span className="ln">136</span><span className="code">  <span className="kw">if</span> (!<span className="prop">this.clientState.runId</span>) <span className="kw">return</span></span></div>
                  <div className="cr-line"><span className="ln">137</span><span className="code">  <span className="prop">this.openStream</span>({'{'}</span></div>
                  <div className="cr-line"><span className="ln">138</span><span className="code">    <span className="prop">abort</span>: <span className="bool">true</span>,</span></div>
                  <div className="cr-line"><span className="ln">139</span><span className="code">    <span className="prop">runId</span>: <span className="prop">this.clientState.runId</span>,</span></div>
                  <div className="cr-line"><span className="ln">140</span><span className="code">  {'}'})</span></div>
                  <div className="cr-line active-diff">
                    <span className="diff-tag">+8 | 135-142</span>
                    <span className="ln">141</span>
                    <span className="code"><span className="prop">this.setState</span>({'{'} status: <span className="str">'aborted'</span> {'}'})</span>
                  </div>
                  <div className="cr-line"><span className="ln">142</span><span className="code">{'}'}</span></div>
                </div>
              </div>

              {/* CODERABBIT REVIEW COMMENT CARD */}
              <div className="cr-review-card">
                <div className="cr-review-header">
                  <div className="cr-avatar-rabbit">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#ffffff">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                  </div>
                  <span className="cr-bot-name">coderabbitai</span>
                  <span className="cr-bot-badge">Bot</span>
                  <span className="cr-bot-date">on May 10 · edited ▾</span>
                </div>

                <div className="cr-review-badges">
                  <span className="badge warning">⚠️ Potential issue</span>
                  <span className="badge sep">|</span>
                  <span className="badge critical">🛑 Critical</span>
                  <span className="badge sep">|</span>
                  <span className="badge lift">🚩 Heavy lift</span>
                </div>

                <div className="cr-review-comment">
                  <code>stop()</code> does not actually execute the abort stream request.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
