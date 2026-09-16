import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

const CARDS = [
  {
    icon: '🤖',
    title: 'AI-flagged, CA-verified',
    desc: 'Taxly AI scans every return for anomalies, aggressive deductions, and mismatches. You review and approve — saving hours of manual checking.'
  },
  {
    icon: '📋',
    title: 'Your own client dashboard',
    desc: 'Manage all client sessions, review chat transcripts, approve ITR XMLs, and download filings — all in one clean dashboard.'
  },
  {
    icon: '💬',
    title: 'Chat review, not form slogging',
    desc: 'See exactly what your client told the AI. Review plain-English conversations instead of deciphering form inputs.'
  },
  {
    icon: '⚡',
    title: 'Instant XML generation',
    desc: 'Once you approve, the ITR XML is generated in seconds. No manual data entry, no re-keying into software.'
  },
  {
    icon: '📱',
    title: 'Async client workflow',
    desc: 'Clients file at their own pace. You review in batches. No scheduling calls just to collect basic income info.'
  },
  {
    icon: '🔒',
    title: 'Secure & compliant',
    desc: 'All data is encrypted at rest and in transit. Compliant with IT Rules 2021 and CERT-In guidelines.'
  }
]

const STEPS = [
  { num: '01', label: 'Join Taxly', desc: 'Apply as a CA partner. We verify your ICAI registration and onboard you in 48 hours.' },
  { num: '02', label: 'Clients file via AI', desc: "Your clients complete their filing through a 20-minute AI chat. You're notified when a session is ready for review." },
  { num: '03', label: 'You review & approve', desc: 'Open the session, read the transcript, check the tax computation, add your notes, and hit Approve.' },
  { num: '04', label: 'Client downloads XML', desc: 'The client pays and downloads their ITR XML. You earn your fee — automatically, per approved filing.' },
]

export default function ForCAsPage() {
  const navigate = useNavigate()

  return (
    <StaticPageLayout title="For CAs: AI flags, you verify">
      <p style={{ fontSize: 18, color: '#4A4F5C', maxWidth: 640, lineHeight: 1.7, margin: '0 auto 48px' }}>
        Taxly is the CA's force-multiplier. Handle 5× more clients in the same time — 
        while maintaining full professional oversight of every return.
      </p>

      {/* Cards grid */}
      <div style={styles.grid}>
        {CARDS.map((c, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardIcon}>{c.icon}</div>
            <h3 style={styles.cardTitle}>{c.title}</h3>
            <p style={styles.cardDesc}>{c.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>How it works</h2>
        <div style={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} style={styles.step}>
              <div style={styles.stepNum}>{s.num}</div>
              <div>
                <div style={styles.stepLabel}>{s.label}</div>
                <div style={styles.stepDesc}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings callout */}
      <div style={styles.earningsBox}>
        <div style={styles.earningsBig}>₹500 – ₹2,000</div>
        <div style={styles.earningsSub}>per approved filing, paid automatically</div>
        <p style={styles.earningsDesc}>
          No invoicing, no chasing clients for payment. Taxly handles collections. 
          You get paid within 7 days of each approved return.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <Link to="/for-cas/apply" style={styles.ctaBtn}>Apply as CA Partner →</Link>
          <a href="mailto:ca@taxly.in" style={styles.ctaSecondary}>Talk to us first</a>
        </div>
      </div>

      {/* FAQ */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Common questions</h2>
        {[
          ['Do I need to be on call for clients?', 'No. Clients complete their filing independently. You review completed sessions at your convenience, in batches.'],
          ["Am I liable if the AI makes an error?", "You approve every return before it's delivered to the client. The CA's professional judgment governs the final output — not the AI."],
          ['What ITR forms does Taxly support?', 'Currently ITR-1 and ITR-2. ITR-4 for presumptive income is coming soon.'],
          ['How do I get paid?', 'Taxly processes client payment at the time of XML delivery. Your share is transferred to your registered bank account within 7 working days.'],
        ].map(([q, a], i) => (
          <div key={i} style={styles.faqItem}>
            <div style={styles.faqQ}>{q}</div>
            <div style={styles.faqA}>{a}</div>
          </div>
        ))}
      </div>
    </StaticPageLayout>
  )
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 64 },
  card: { background: '#fff', border: '1px solid #E5E2D9', borderRadius: 16, padding: 28 },
  cardIcon: { fontSize: 32, marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#0D1117', marginBottom: 8 },
  cardDesc: { fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
  section: { marginBottom: 64 },
  sectionTitle: { fontSize: 28, fontWeight: 800, color: '#0D1117', marginBottom: 28, textAlign: 'center' },
  steps: { display: 'flex', flexDirection: 'column', gap: 0 },
  step: { display: 'flex', gap: 20, padding: '24px 0', borderBottom: '1px solid #EFEDE7', alignItems: 'flex-start' },
  stepNum: { fontSize: 28, fontWeight: 900, color: '#E5E2D9', fontFamily: 'IBM Plex Mono, monospace', minWidth: 48, flexShrink: 0 },
  stepLabel: { fontSize: 16, fontWeight: 700, color: '#0D1117', marginBottom: 4 },
  stepDesc: { fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
  earningsBox: { background: 'linear-gradient(135deg, #0B1A33 0%, #0D7A5F 100%)', borderRadius: 24, padding: '52px 40px', textAlign: 'center', marginBottom: 64, color: '#fff' },
  earningsBig: { fontSize: 52, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 },
  earningsSub: { fontSize: 16, opacity: 0.75, marginBottom: 20 },
  earningsDesc: { fontSize: 15, opacity: 0.8, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 },
  ctaBtn: { background: '#fff', color: '#0D1117', borderRadius: 12, padding: '14px 28px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
  ctaSecondary: { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 12, padding: '14px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
  faqItem: { borderBottom: '1px solid #EFEDE7', padding: '20px 0' },
  faqQ: { fontSize: 15, fontWeight: 700, color: '#0D1117', marginBottom: 6 },
  faqA: { fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
}
