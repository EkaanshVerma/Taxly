import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function RefundPolicyPage() {
  return (
    <StaticPageLayout title="Refund Policy">
      <div style={s.meta}>Last updated: June 15, 2025</div>

      <div style={s.guarantee}>
        <div style={s.guaranteeEmoji}>🛡️</div>
        <h2 style={s.guaranteeTitle}>7-Day Money-Back Guarantee</h2>
        <p style={s.guaranteeDesc}>
          If you're not satisfied with Taxly's service before your ITR XML is generated, 
          we'll refund 100% of your filing fee — no questions asked.
        </p>
      </div>

      {[
        {
          title: 'When you are eligible for a refund',
          items: [
            'You request a refund within 7 days of payment',
            'Your ITR XML has not yet been generated or downloaded',
            'You have not uploaded the return to the ITD portal using Taxly\'s XML',
          ]
        },
        {
          title: 'When you are not eligible for a refund',
          items: [
            'Your ITR XML has already been generated and delivered to you',
            'More than 7 days have passed since payment',
            'The filing was rejected by the ITD portal due to incorrect information you provided',
            'You changed your mind after the CA has already reviewed and approved your return',
          ]
        },
      ].map((section, i) => (
        <div key={i} style={s.section}>
          <h3 style={s.h3}>{section.title}</h3>
          <ul style={s.ul}>
            {section.items.map((item, j) => (
              <li key={j} style={{ color: i === 1 ? '#DC2626' : '#16a34a' }}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={s.section}>
        <h3 style={s.h3}>How to request a refund</h3>
        <div style={s.steps}>
          {[
            ['Email us', 'Send a refund request to refund@taxly.in from your registered email address.'],
            ['Include your details', 'Include your registered email, payment date, and reason for the refund request.'],
            ['Processing time', 'Approved refunds are processed within 5–7 business days to your original payment method.'],
          ].map(([step, desc], i) => (
            <div key={i} style={s.step}>
              <div style={s.stepCircle}>{i + 1}</div>
              <div>
                <div style={s.stepTitle}>{step}</div>
                <div style={s.stepDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <h3 style={s.h3}>Partial refunds</h3>
        <p style={s.p}>
          If you've started a filing session but not completed payment, no charge has been made. 
          If you've paid and the CA review is in progress but the XML has not been generated, 
          you may still be eligible for a full refund within the 7-day window.
        </p>
      </div>

      <div style={s.section}>
        <h3 style={s.h3}>Payment method</h3>
        <p style={s.p}>
          Refunds are credited to the original payment method (credit/debit card, UPI, or net banking). 
          Bank processing times may vary. Taxly does not charge any refund processing fee.
        </p>
      </div>

      <div style={s.contactBox}>
        <p style={{ margin: 0, fontSize: 15 }}>
          Questions about refunds? Email <a href="mailto:refund@taxly.in" style={s.link}>refund@taxly.in</a> or 
          read our full <Link to="/terms-and-conditions" style={s.link}>Terms and Conditions</Link>.
        </p>
      </div>
    </StaticPageLayout>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 24 },
  guarantee: { background: 'linear-gradient(135deg, #0D7A5F15, #1B4FD815)', border: '1.5px solid #0D7A5F30', borderRadius: 20, padding: '36px', textAlign: 'center', marginBottom: 48 },
  guaranteeEmoji: { fontSize: 48, marginBottom: 12 },
  guaranteeTitle: { fontSize: 24, fontWeight: 900, color: '#0D1117', marginBottom: 12 },
  guaranteeDesc: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' },
  section: { marginBottom: 40 },
  h3: { fontSize: 18, fontWeight: 800, color: '#0D1117', marginBottom: 16 },
  p: { fontSize: 15, color: '#4A4F5C', lineHeight: 1.7 },
  ul: { paddingLeft: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  steps: { display: 'flex', flexDirection: 'column', gap: 20 },
  step: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  stepCircle: { width: 32, height: 32, borderRadius: '50%', background: '#0D7A5F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  stepTitle: { fontWeight: 700, fontSize: 15, color: '#0D1117', marginBottom: 4 },
  stepDesc: { fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
  contactBox: { background: '#F7F6F2', borderRadius: 12, padding: '20px 24px', marginTop: 16 },
  link: { color: '#1B4FD8', textDecoration: 'underline' },
}
