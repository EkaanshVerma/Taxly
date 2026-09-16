import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

function calcOld(gross) {
  const taxable = Math.max(0, gross - 50000 - 150000)
  let tax = 0
  if (taxable > 1000000) tax = 112500 + (taxable - 1000000) * 0.30
  else if (taxable > 500000) tax = 12500 + (taxable - 500000) * 0.20
  else if (taxable > 250000) tax = (taxable - 250000) * 0.05
  return taxable > 500000 ? Math.round(tax * 1.04) : 0
}

function calcNew(gross) {
  const taxable = Math.max(0, gross - 75000)
  let tax = 0
  if (taxable > 1500000) tax = 140000 + (taxable - 1500000) * 0.30
  else if (taxable > 1200000) tax = 80000 + (taxable - 1200000) * 0.20
  else if (taxable > 1000000) tax = 50000 + (taxable - 1000000) * 0.15
  else if (taxable > 700000) tax = 20000 + (taxable - 700000) * 0.10
  else if (taxable > 300000) tax = (taxable - 300000) * 0.05
  return taxable > 700000 ? Math.round(tax * 1.04) : 0
}

const fmt = n => '₹' + n.toLocaleString('en-IN')

export default function GuideOldVsNewPage() {
  const [salary, setSalary] = useState(1200000)
  const oldTax = calcOld(salary)
  const newTax = calcNew(salary)
  const rec = oldTax <= newTax ? 'old' : 'new'
  const savings = Math.abs(oldTax - newTax)

  return (
    <StaticPageLayout title="Old vs New Tax Regime (AY 2025–26)">
      <div style={s.meta}>AY 2025–26 · 5 min read · Includes live calculator</div>

      <p style={s.lead}>
        The new tax regime got a major upgrade in Budget 2024 — zero tax on income up to ₹7L, higher standard deduction, 
        and simplified slabs. But is it better for you? Depends on your deductions. Here's how to decide.
      </p>

      {/* Live calculator */}
      <div style={s.calcBox}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0D1117', marginBottom: 16 }}>Live calculator — drag to compare</h2>
        <div style={s.sliderRow}>
          <span style={s.sliderLabel}>Gross salary</span>
          <span style={s.sliderVal}>{fmt(salary)}</span>
        </div>
        <input
          type="range" min="300000" max="5000000" step="50000" value={salary}
          onChange={e => setSalary(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#1B4FD8', marginBottom: 20 }}
        />
        <div style={s.regimeCards}>
          <div style={{ ...s.regCard, ...(rec === 'old' ? s.winner : {}) }}>
            <div style={s.regLabel}>Old Regime</div>
            <div style={s.regAmt}>{fmt(oldTax)}</div>
            {rec === 'old' && <div style={s.badge}>✓ Best for you</div>}
          </div>
          <div style={{ ...s.regCard, ...(rec === 'new' ? s.winner : {}) }}>
            <div style={s.regLabel}>New Regime</div>
            <div style={s.regAmt}>{fmt(newTax)}</div>
            {rec === 'new' && <div style={s.badge}>✓ Best for you</div>}
          </div>
        </div>
        {savings > 0 && (
          <p style={s.savingsHint}>
            💡 Choosing the <strong>{rec} regime</strong> saves you <strong>{fmt(savings)}</strong> in tax.
          </p>
        )}
        <p style={{ fontSize: 12, color: '#8A8FA3', marginTop: 12 }}>
          Assumes: Standard deduction, ₹1.5L Section 80C (old regime only). Add HRA/80D for more accurate results — use Taxly's full filing flow.
        </p>
      </div>

      <h2 style={s.h2}>Key differences</h2>
      <div style={{ overflowX: 'auto', marginBottom: 40 }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Factor</th>
              <th style={s.th}>Old Regime</th>
              <th style={s.th}>New Regime (FY25-26)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Standard deduction', '₹50,000', '₹75,000'],
              ['Zero tax up to', '₹5L (with rebate)', '₹7L (with rebate)'],
              ['80C deductions', '✓ Up to ₹1.5L', '✕ Not available'],
              ['HRA exemption', '✓ Applicable', '✕ Not available'],
              ['80D health insurance', '✓ Up to ₹25,000', '✕ Not available'],
              ['NPS employer contribution (80CCD(2))', '✓ Available', '✓ Available (up to 14% of salary)'],
              ['Tax slabs', 'Old progressive slabs', 'New simplified slabs'],
            ].map(([f, o, n], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#F7F6F2' : '#fff' }}>
                <td style={s.td}>{f}</td>
                <td style={{ ...s.td, color: o.startsWith('✕') ? '#DC2626' : '#0f172a' }}>{o}</td>
                <td style={{ ...s.td, color: n.startsWith('✕') ? '#DC2626' : n.startsWith('✓') ? '#16a34a' : '#0f172a' }}>{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={s.h2}>Who benefits from which regime?</h2>
      <div style={s.twoCol}>
        <div style={{ ...s.regSuggest, borderColor: '#86EFAC', background: '#F0FFF8' }}>
          <div style={s.regSuggestTitle}>Old Regime suits you if…</div>
          <ul style={s.ul}>
            <li>You max out 80C (₹1.5L) — PPF, ELSS, LIC</li>
            <li>You pay significant rent (HRA exemption)</li>
            <li>You have 80D health insurance premiums</li>
            <li>You have a home loan (Section 24B)</li>
            <li>Your total deductions exceed ₹3.75L</li>
          </ul>
        </div>
        <div style={{ ...s.regSuggest, borderColor: '#93C5FD', background: '#EFF6FF' }}>
          <div style={s.regSuggestTitle}>New Regime suits you if…</div>
          <ul style={s.ul}>
            <li>Your income is under ₹7L (zero tax)</li>
            <li>You don't invest in 80C instruments</li>
            <li>You live in company-provided accommodation</li>
            <li>You want simpler taxes without tracking deductions</li>
            <li>Your deductions are under ₹2L total</li>
          </ul>
        </div>
      </div>

      <div style={s.ctaCard}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Still not sure? Let Taxly calculate for your exact situation.</p>
        <p style={{ fontSize: 14.5, color: '#4A4F5C', marginBottom: 20, lineHeight: 1.6 }}>
          Our AI will ask about your actual deductions, HRA, home loan, and investments — then recommend the best regime for you personally.
        </p>
        <Link to="/" style={s.ctaBtn}>Get my recommendation free →</Link>
      </div>
    </StaticPageLayout>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  lead: { fontSize: 17, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 36, maxWidth: 680 },
  h2: { fontSize: 22, fontWeight: 800, color: '#0D1117', margin: '40px 0 16px' },
  calcBox: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 20, padding: '28px 28px 20px', marginBottom: 40 },
  sliderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderLabel: { fontSize: 13.5, color: '#4A4F5C', fontWeight: 600 },
  sliderVal: { fontSize: 18, fontWeight: 800, color: '#1B4FD8', fontFamily: 'IBM Plex Mono, monospace' },
  regimeCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  regCard: { background: '#fff', border: '1.5px solid #E5E2D9', borderRadius: 14, padding: '16px', textAlign: 'center', cursor: 'default' },
  winner: { border: '2px solid #0D7A5F', background: 'rgba(13,122,95,0.05)' },
  regLabel: { fontSize: 12, color: '#8A8FA3', fontWeight: 600, marginBottom: 4 },
  regAmt: { fontSize: 22, fontWeight: 900, color: '#0D1117', fontFamily: 'IBM Plex Mono, monospace' },
  badge: { display: 'inline-block', background: '#0D7A5F', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, marginTop: 8 },
  savingsHint: { fontSize: 14, color: '#0D7A5F', background: 'rgba(13,122,95,0.08)', borderRadius: 8, padding: '10px 14px', margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14.5 },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: 700, background: '#F7F6F2', borderBottom: '2px solid #E5E2D9', fontSize: 13 },
  td: { padding: '12px 16px', borderBottom: '1px solid #EFEDE7' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 },
  regSuggest: { border: '1.5px solid', borderRadius: 16, padding: '24px' },
  regSuggestTitle: { fontWeight: 800, fontSize: 15, color: '#0D1117', marginBottom: 12 },
  ul: { paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  ctaCard: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 16, padding: '28px 32px' },
  ctaBtn: { background: '#0D7A5F', color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
}
