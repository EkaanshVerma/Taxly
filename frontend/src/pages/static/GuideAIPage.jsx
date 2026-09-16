import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

const STEPS = [
  {
    step: '01', title: 'You tell Taxly about your finances in plain English',
    desc: 'Taxly AI asks you simple questions: salary, investments, rent paid, insurance. No forms, no tax jargon. It understands answers like "I invest in ELSS every month" and maps them to the right tax sections automatically.'
  },
  {
    step: '02', title: 'AI parses your Form 16 (optional)',
    desc: 'Upload your Form 16 PDF. The AI extracts gross salary, standard deduction, TDS deducted, and any employer-side benefits (LTA, perks). It reconciles this with what you told it and flags mismatches.'
  },
  {
    step: '03', title: 'AI identifies every applicable deduction',
    desc: 'Based on your answers, Taxly maps each fact to an ITR section: 80C for PPF/ELSS, 80D for insurance, Section 24B for home loan interest, HRA exemption rules, 80E for education loan interest. It applies the legally correct limits and calculates the optimal total.'
  },
  {
    step: '04', title: 'Regime comparison runs automatically',
    desc: 'Taxly computes your tax liability under both old and new regime with the actual deductions, not a generic estimate. It recommends the regime that saves you more money — and shows you the exact difference.'
  },
  {
    step: '05', title: 'A CA reviews the computation',
    desc: 'Before your XML is generated, a registered CA checks the AI\'s work. They review the deduction claims, verify the regime choice, and approve or flag corrections. This is what makes Taxly legally sound — not just automated.'
  },
  {
    step: '06', title: 'ITR XML generated and delivered',
    desc: 'Once the CA approves, your ITR XML is generated in the exact format required by the Income Tax Department\'s e-filing portal. You upload it directly — no software needed.'
  },
]

export default function GuideAIPage() {
  return (
    <StaticPageLayout title="How Taxly's AI Tax Deductions Work">
      <div style={s.meta}>Technical explainer · 6 min read · How the AI identifies deductions</div>

      <p style={s.lead}>
        Taxly isn't a chatbot that fills a form for you. It's a purpose-built AI trained specifically 
        on Indian income tax rules — Section references, deduction limits, regime conditions, and Form 16 parsing. 
        Here's exactly how it works.
      </p>

      {/* Steps */}
      <div style={s.steps}>
        {STEPS.map((st, i) => (
          <div key={i} style={s.step}>
            <div style={s.stepNum}>{st.step}</div>
            <div style={s.stepContent}>
              <div style={s.stepTitle}>{st.title}</div>
              <div style={s.stepDesc}>{st.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* What AI can and can't do */}
      <h2 style={s.h2}>What the AI can and cannot do</h2>
      <div style={s.twoCol}>
        <div style={s.canBox}>
          <div style={s.boxTitle}>✓ What the AI does</div>
          <ul style={s.ul}>
            <li>Maps plain-English answers to ITR sections</li>
            <li>Applies correct deduction limits (80C cap: ₹1.5L, etc.)</li>
            <li>Parses and reads Form 16 PDFs</li>
            <li>Computes old vs new regime tax</li>
            <li>Identifies HRA exemption based on rent, city, and salary</li>
            <li>Flags likely mismatches (TDS vs reported salary)</li>
            <li>Generates standards-compliant ITR XML</li>
          </ul>
        </div>
        <div style={s.cannotBox}>
          <div style={s.boxTitle}>✗ What the AI does not do</div>
          <ul style={s.ul}>
            <li>Give personal financial advice</li>
            <li>Handle complex capital gains strategies</li>
            <li>Represent you in tax proceedings</li>
            <li>Guarantee outcomes — CAs review everything</li>
            <li>Access your bank or ITD portal data directly</li>
          </ul>
        </div>
      </div>

      {/* CA layer */}
      <div style={s.caBox}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>The CA layer is not optional</h3>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, maxWidth: 600 }}>
          Every Taxly return is reviewed by a registered CA before XML generation. The CA sees the full 
          conversation transcript, the computed deductions, and the regime recommendation. They can override 
          any AI decision. This is what makes Taxly a professional service — not just a calculator.
        </p>
      </div>

      {/* Accuracy note */}
      <div style={s.disclaimerBox}>
        <p style={{ margin: 0, fontSize: 14, color: '#78350F', lineHeight: 1.7 }}>
          <strong>Accuracy:</strong> Taxly's AI has been tested against 50,000+ real filing scenarios. 
          However, tax outcomes depend on information provided by the user. Always verify your AIS 
          (Annual Information Statement) on the ITD portal before filing.
        </p>
      </div>

      <div style={s.ctaCard}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ready to try it?</p>
        <p style={{ fontSize: 14.5, color: '#4A4F5C', marginBottom: 20, lineHeight: 1.6 }}>
          The first 20-minute AI session is completely free. You only pay when you download your ITR XML.
        </p>
        <Link to="/" style={s.ctaBtn}>Start filing free →</Link>
      </div>
    </StaticPageLayout>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  lead: { fontSize: 17, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 40, maxWidth: 680 },
  h2: { fontSize: 22, fontWeight: 800, color: '#0D1117', margin: '48px 0 20px' },
  steps: { display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 },
  step: { display: 'flex', gap: 24, padding: '28px 0', borderBottom: '1px solid #EFEDE7' },
  stepNum: { fontSize: 32, fontWeight: 900, color: '#E5E2D9', fontFamily: 'IBM Plex Mono, monospace', minWidth: 48, flexShrink: 0, paddingTop: 2 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: 800, color: '#0D1117', marginBottom: 8 },
  stepDesc: { fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.7 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 },
  canBox: { background: '#F0FFF8', border: '1.5px solid #86EFAC', borderRadius: 16, padding: 24 },
  cannotBox: { background: '#FFF5F5', border: '1.5px solid #FCA5A5', borderRadius: 16, padding: 24 },
  boxTitle: { fontWeight: 800, fontSize: 14, color: '#0D1117', marginBottom: 12 },
  ul: { paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#4A4F5C', lineHeight: 1.5 },
  caBox: { background: 'linear-gradient(135deg, #0B1A33, #0D7A5F)', borderRadius: 20, padding: '36px', marginBottom: 32 },
  disclaimerBox: { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '16px 20px', marginBottom: 40 },
  ctaCard: { background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 16, padding: '28px 32px' },
  ctaBtn: { background: '#0D7A5F', color: '#fff', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
}
