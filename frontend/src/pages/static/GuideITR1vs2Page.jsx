import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

const TABLE = [
  ['Who should file', 'Salaried with one employer, pension, one house property, interest income up to ₹10,000', 'Two or more employers, multiple house properties, capital gains, lottery, foreign income/assets'],
  ['Capital gains', '✕ Not allowed', '✓ STCG and LTCG covered'],
  ['Foreign assets / income', '✕ Not allowed', '✓ Required for NRIs and those with foreign holdings'],
  ['Business / freelance income', '✕ Not allowed', '✕ Use ITR-4 (presumptive) or ITR-3'],
  ['Resident status', 'Only Resident Individuals', 'Resident, NR, RNOR'],
  ['Complexity', '⭐ Simple (most salaried people)', '⭐⭐ Moderate — more schedules'],
]

export default function GuideITR1vs2Page() {
  return (
    <StaticPageLayout title="ITR-1 vs ITR-2: Which Form Do You Need?">
      <div style={s.meta}>AY 2025–26 · 3 min read · Updated June 2025</div>

      <p style={s.lead}>
        The most common source of confusion at filing time — are you an ITR-1 filer or ITR-2? 
        Get it wrong and your return will be defective. Here's a plain-English breakdown.
      </p>

      <h2 style={s.h2}>The one-sentence rule</h2>
      <div style={s.ruleBox}>
        <p style={s.ruleText}>
          <strong>If you have only salary/pension, one house, and simple interest income → ITR-1.</strong><br/>
          <strong>If you have capital gains, multiple houses, foreign income, or are an NRI → ITR-2.</strong>
        </p>
      </div>

      <h2 style={s.h2}>Side-by-side comparison</h2>
      <div style={{ overflowX: 'auto', marginBottom: 40 }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Feature</th>
              <th style={{ ...s.th, color: '#0D7A5F' }}>ITR-1 (Sahaj)</th>
              <th style={{ ...s.th, color: '#1B4FD8' }}>ITR-2</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map(([feat, itr1, itr2], i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#F7F6F2' : '#fff' }}>
                <td style={s.td}>{feat}</td>
                <td style={{ ...s.td, color: itr1.startsWith('✕') ? '#DC2626' : itr1.startsWith('✓') ? '#16a34a' : '#0f172a' }}>{itr1}</td>
                <td style={{ ...s.td, color: itr2.startsWith('✕') ? '#DC2626' : itr2.startsWith('✓') ? '#16a34a' : '#0f172a' }}>{itr2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={s.h2}>Common edge cases</h2>
      {[
        ['I have a savings account with ₹40,000 interest', 'ITR-1 — interest from savings and FDs up to ₹10,000 from a single source is allowed in ITR-1. Above that, use ITR-2.'],
        ['I sold mutual funds this year', 'ITR-2 — any redemption of equity or debt mutual funds counts as capital gains. Even ₹1 of LTCG requires ITR-2.'],
        ['I freelance on weekends', 'ITR-4 — if your freelance income is below ₹75L you can use presumptive taxation (Section 44ADA). Otherwise ITR-3.'],
        ['I work in 2 companies during the same year', 'ITR-1 is still fine — just ensure you\'ve consolidated Form 16 from both employers and declared the combined income.'],
      ].map(([q, a], i) => (
        <div key={i} style={s.edgeCase}>
          <div style={s.edgeQ}>"{q}"</div>
          <div style={s.edgeA}>→ {a}</div>
        </div>
      ))}

      <div style={s.ctaCard}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Not sure which form you need?</p>
        <p style={{ fontSize: 14.5, color: '#4A4F5C', marginBottom: 20, lineHeight: 1.6 }}>
          Start your filing on Taxly — the AI will ask the right questions and automatically route you to the correct ITR form.
        </p>
        <Link to="/" style={s.ctaBtn}>Start filing free →</Link>
      </div>
    </StaticPageLayout>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  lead: { fontSize: 17, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 36, maxWidth: 680 },
  h2: { fontSize: 22, fontWeight: 800, color: '#0D1117', margin: '36px 0 16px' },
  ruleBox: { background: '#F0FFF8', border: '1.5px solid #86EFAC', borderRadius: 14, padding: '20px 24px', marginBottom: 36 },
  ruleText: { fontSize: 15.5, color: '#15803D', lineHeight: 1.7, margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14.5, marginBottom: 8 },
  th: { padding: '12px 16px', textAlign: 'left', fontWeight: 700, background: '#F7F6F2', borderBottom: '2px solid #E5E2D9', fontSize: 13 },
  td: { padding: '12px 16px', borderBottom: '1px solid #EFEDE7', verticalAlign: 'top', lineHeight: 1.5 },
  edgeCase: { borderLeft: '3px solid #1B4FD8', paddingLeft: 16, marginBottom: 20 },
  edgeQ: { fontSize: 14.5, fontStyle: 'italic', color: '#0D1117', fontWeight: 600, marginBottom: 4 },
  edgeA: { fontSize: 14, color: '#4A4F5C', lineHeight: 1.6 },
  ctaCard: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 16, padding: '28px 32px', marginTop: 48 },
  ctaBtn: { background: '#0D7A5F', color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
}
