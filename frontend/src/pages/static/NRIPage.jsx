import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

const GUIDES = [
  { href: '/guides/itr-1-vs-itr-2', emoji: '📋', title: 'ITR-1 vs ITR-2', desc: 'Which form do you need to file? Understand the difference in under 3 minutes.' },
  { href: '/guides/old-vs-new-regime-2025', emoji: '⚖️', title: 'Old vs New Tax Regime (AY 2025–26)', desc: 'Side-by-side comparison with a calculator to find which saves you more.' },
  { href: '/guides/nri-tax-filing-india', emoji: '✈️', title: 'NRI Tax Filing in India', desc: 'RNOR vs NRI, DTAA, foreign income, and what you must declare.' },
  { href: '/guides/how-tax-deduction-ai-works', emoji: '🤖', title: 'How AI Tax Deductions Work', desc: "How Taxly's AI identifies and applies deductions from your conversation." },
]

const FAQS = [
  {
    q: 'What deductions should salaried individuals claim?',
    a: 'Under the old regime: Section 80C (up to ₹1.5L for PPF, ELSS, LIC), HRA exemption, standard deduction (₹50,000), and Section 80D for medical insurance (up to ₹25,000). Under the new regime, most deductions are not available except the standard deduction (now ₹75,000).'
  },
  {
    q: 'What is the deadline for filing ITR for AY 2025–26?',
    a: '31 July 2025 for individuals not subject to audit. A belated return can be filed until 31 December 2025 with a late fee of up to ₹5,000 under Section 234F.'
  },
  {
    q: 'Do I need to file if my income is below the basic exemption limit?',
    a: 'Not mandatory, but recommended if you want to claim a refund, carry forward losses, or if your TDS has been deducted. You should also file if you have foreign assets or income.'
  },
  {
    q: 'Is Taxly a licensed CA firm?',
    a: 'No. Taxly is a technology platform that automates data collection and ITR XML generation. All returns are reviewed by registered CAs before delivery. Taxly is not itself an ICAI-registered firm.'
  },
  {
    q: 'Can Taxly file for freelancers or people with business income?',
    a: 'Yes, for ITR-4 (presumptive income under Section 44ADA or 44AD). Complex capital gains or foreign income may require the Pro/NRI tier.'
  },
  {
    q: "What happens if there's an income tax notice?",
    a: 'Taxly provides a 90-day notice response window on the Premium and Pro tiers. A registered CA will review the notice and help draft the response. Additional legal fees may apply for court proceedings.'
  },
]

export default function NRIPage() {
  return (
    <StaticPageLayout title="Filing Guides & Tax FAQs">
      <p style={{ fontSize: 17, color: '#4A4F5C', textAlign: 'center', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }}>
        Plain-English answers to the most common Indian income tax questions — no CA-speak.
      </p>

      {/* Guides */}
      <h2 style={sty.h2}>Step-by-step guides</h2>
      <div style={sty.guideGrid}>
        {GUIDES.map((g, i) => (
          <Link key={i} to={g.href} style={sty.guideCard}>
            <div style={sty.guideEmoji}>{g.emoji}</div>
            <div style={sty.guideTitle}>{g.title}</div>
            <div style={sty.guideDesc}>{g.desc}</div>
            <div style={sty.guideArrow}>Read →</div>
          </Link>
        ))}
      </div>

      {/* FAQ */}
      <h2 style={{ ...sty.h2, marginTop: 64 }}>Frequently asked questions</h2>
      <div style={sty.faqList}>
        {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
      </div>

      <div style={sty.cta}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Still have questions?</h3>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>Our AI will answer tax questions and file your return in the same session.</p>
        <Link to="/" style={sty.ctaBtn}>Start filing — it's free →</Link>
      </div>
    </StaticPageLayout>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div style={{ borderBottom: '1px solid #EFEDE7' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 12 }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 600, color: '#0D1117', lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 20, color: '#8A8FA3', flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
      </button>
      {open && <p style={{ fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.7, paddingBottom: 18, margin: 0 }}>{a}</p>}
    </div>
  )
}

const sty = {
  h2: { fontSize: 26, fontWeight: 800, color: '#0D1117', marginBottom: 24 },
  guideGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 },
  guideCard: { background: '#fff', border: '1px solid #E5E2D9', borderRadius: 16, padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6, transition: 'transform 0.15s, box-shadow 0.15s' },
  guideEmoji: { fontSize: 28, marginBottom: 4 },
  guideTitle: { fontSize: 16, fontWeight: 700, color: '#0D1117' },
  guideDesc: { fontSize: 13.5, color: '#4A4F5C', lineHeight: 1.5, flex: 1 },
  guideArrow: { fontSize: 13.5, color: '#1B4FD8', fontWeight: 600, marginTop: 8 },
  faqList: { display: 'flex', flexDirection: 'column' },
  cta: { background: 'linear-gradient(135deg, #0B1A33, #0D7A5F)', borderRadius: 24, padding: '48px 40px', textAlign: 'center', marginTop: 64 },
  ctaBtn: { background: '#fff', color: '#0D1117', borderRadius: 12, padding: '14px 32px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
}
