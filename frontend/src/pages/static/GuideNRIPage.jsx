import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function GuideNRIPage() {
  return (
    <StaticPageLayout title="NRI Tax Filing in India — Complete Guide (AY 2025–26)">
      <div style={s.meta}>AY 2025–26 · 7 min read · Updated June 2025</div>

      <p style={s.lead}>
        Non-Resident Indians (NRIs) often face the most confusing tax situations — multiple currencies, 
        DTAA treaties, RNOR status, and foreign assets. This guide covers everything you need to know.
      </p>

      <Section title="Step 1: Determine your residential status">
        <p style={s.p}>Your tax liability depends entirely on your residential status for the financial year.</p>
        <div style={s.statusGrid}>
          {[
            { label: 'Resident (R & OR)', rule: 'In India ≥ 182 days in the FY, or ≥ 60 days in FY + ≥ 365 days in the last 4 FYs', tax: 'Global income taxable in India' },
            { label: 'RNOR (Resident but Not Ordinarily Resident)', rule: 'Resident this year but NRI in 9 of last 10 years, or <729 days in India in last 7 years', tax: 'Only Indian-sourced income taxable (for 2 years after return)' },
            { label: 'NRI (Non-Resident)', rule: 'In India < 182 days in the FY (or <60 days if visiting Indian citizen)', tax: 'Only Indian-sourced income taxable' },
          ].map((r, i) => (
            <div key={i} style={s.statusCard}>
              <div style={s.statusLabel}>{r.label}</div>
              <div style={s.statusRule}><b>Rule:</b> {r.rule}</div>
              <div style={s.statusTax}><b>Tax:</b> {r.tax}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Step 2: What income must you declare?">
        <p style={s.p}>As an NRI, you are taxed on income <em>earned or received in India</em>:</p>
        {[
          ['✓ Taxable in India', ['Salary paid in India or for services rendered in India', 'Rental income from Indian property', 'Capital gains on Indian assets (stocks, real estate, MFs)', 'Interest on NRO accounts', 'Dividends from Indian companies']],
          ['✕ Not taxable in India', ['Foreign salary (unless earned in India)', 'NRE / FCNR account interest', 'Foreign dividends and capital gains', 'Gifts received abroad']],
        ].map(([heading, items], i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: i === 0 ? '#DC2626' : '#16a34a', marginBottom: 8 }}>{heading}</div>
            <ul style={s.ul}>{items.map((it, j) => <li key={j}>{it}</li>)}</ul>
          </div>
        ))}
      </Section>

      <Section title="Step 3: DTAA — avoiding double taxation">
        <p style={s.p}>
          India has Double Taxation Avoidance Agreements with 90+ countries. If you've already paid tax abroad 
          on income that's also taxable in India, DTAA lets you claim a credit.
        </p>
        <div style={s.infoBox}>
          <b>To claim DTAA relief:</b> You'll need a Tax Residency Certificate (TRC) from the country of residence 
          and Form 10F. Taxly Pro handles this automatically.
        </div>
      </Section>

      <Section title="Step 4: Foreign assets — Schedule FA">
        <p style={s.p}>
          If you held any foreign bank account, property, equity, or trust at any time during FY 2024–25, 
          you must disclose them in Schedule FA, even if you earned no income from them.
        </p>
        <div style={{ ...s.infoBox, background: '#FEF3C7', borderColor: '#FCD34D', color: '#78350F' }}>
          ⚠ Failure to disclose foreign assets under FEMA and Black Money Act can attract penalties of up to 
          ₹10 lakh per year of non-disclosure.
        </div>
      </Section>

      <Section title="Which ITR form do NRIs file?">
        <p style={s.p}>NRIs cannot file ITR-1. The correct form is:</p>
        <ul style={s.ul}>
          <li><b>ITR-2</b> — for salary, capital gains, foreign income (no business income)</li>
          <li><b>ITR-3</b> — if you have business or professional income</li>
        </ul>
      </Section>

      <div style={s.ctaCard}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Filing as an NRI? Taxly Pro handles it.</p>
        <p style={{ fontSize: 14.5, color: '#4A4F5C', marginBottom: 20, lineHeight: 1.6 }}>
          DTAA credits, Schedule FA, NRO/NRE income — our AI + CA team handles the full complexity.
        </p>
        <Link to="/pricing" style={s.ctaBtn}>See Taxly Pro →</Link>
      </div>
    </StaticPageLayout>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 21, fontWeight: 800, color: '#0D1117', marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  lead: { fontSize: 17, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 36, maxWidth: 680 },
  p: { fontSize: 15, color: '#4A4F5C', lineHeight: 1.7, marginBottom: 16 },
  statusGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 },
  statusCard: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 12, padding: '18px 20px' },
  statusLabel: { fontWeight: 800, fontSize: 15, color: '#0D1117', marginBottom: 6 },
  statusRule: { fontSize: 13.5, color: '#4A4F5C', marginBottom: 4 },
  statusTax: { fontSize: 13.5, color: '#0D7A5F', fontWeight: 600 },
  ul: { paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
  infoBox: { background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 12, padding: '16px 20px', fontSize: 14.5, color: '#1e3a8a', lineHeight: 1.6 },
  ctaCard: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 16, padding: '28px 32px', marginTop: 16 },
  ctaBtn: { background: '#0D7A5F', color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
}
