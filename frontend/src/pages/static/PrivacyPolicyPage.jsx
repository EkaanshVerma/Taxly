import React from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function PrivacyPolicyPage() {
  const updated = 'June 15, 2025'
  return (
    <StaticPageLayout title="Privacy Policy">
      <div style={s.meta}>Last updated: {updated}</div>
      <p style={s.intro}>
        Taxly ("we", "our", "us") operates at taxly.in. This Privacy Policy explains how we collect, use, 
        and protect your personal information when you use our tax filing service.
      </p>

      <Section title="1. Information we collect">
        <ul style={s.ul}>
          <li><b>Identity data:</b> Name, email address, PAN (if provided for ITR generation), phone number.</li>
          <li><b>Financial data:</b> Salary information, investment declarations, Form 16 contents, bank statement summaries you share in chat.</li>
          <li><b>Usage data:</b> Pages visited, session duration, device type, IP address, browser.</li>
          <li><b>Communications:</b> Chat transcripts between you and Taxly AI.</li>
        </ul>
        <p style={s.p}>We do not collect your banking credentials, Aadhaar number (directly), or access your ITD account.</p>
      </Section>

      <Section title="2. How we use your data">
        <ul style={s.ul}>
          <li>To generate your ITR XML and facilitate CA review</li>
          <li>To send you filing-related communications (OTP, status updates, CA notes)</li>
          <li>To improve Taxly AI accuracy and service quality</li>
          <li>To comply with legal obligations under Indian tax law and IT Rules 2021</li>
        </ul>
        <p style={s.p}>We <b>do not</b> sell your personal data to third parties. We do not use your financial data for advertising.</p>
      </Section>

      <Section title="3. Data sharing">
        <p style={s.p}>Your data may be shared with:</p>
        <ul style={s.ul}>
          <li><b>CA partners</b> on the Taxly network — only for the purpose of reviewing your return</li>
          <li><b>Payment processors</b> (Razorpay) — only payment transaction data, not financial filing data</li>
          <li><b>Cloud infrastructure</b> (AWS, Google Cloud) — under data processing agreements</li>
          <li><b>Legal authorities</b> — if required by law, court order, or CERT-In directive</li>
        </ul>
      </Section>

      <Section title="4. Data retention">
        <p style={s.p}>
          We retain your filing data for <b>7 years</b> in line with Indian income tax record-keeping requirements 
          (Section 44AA). You may request deletion of your account data at any time, subject to statutory obligations.
        </p>
      </Section>

      <Section title="5. Security">
        <p style={s.p}>
          All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We follow CERT-In security guidelines. 
          Taxly undergoes annual security audits. See our <a href="/security" style={s.link}>Security page</a> for details.
        </p>
      </Section>

      <Section title="6. Your rights">
        <ul style={s.ul}>
          <li><b>Access:</b> Request a copy of your personal data</li>
          <li><b>Correction:</b> Ask us to correct inaccurate data</li>
          <li><b>Deletion:</b> Request deletion of your account (subject to retention requirements)</li>
          <li><b>Portability:</b> Request your data in machine-readable format</li>
        </ul>
        <p style={s.p}>To exercise these rights, email <a href="mailto:privacy@taxly.in" style={s.link}>privacy@taxly.in</a>.</p>
      </Section>

      <Section title="7. Cookies">
        <p style={s.p}>
          We use essential cookies for authentication and session management. We use analytics cookies (Google Analytics) 
          to understand usage patterns. You can disable analytics cookies in your browser settings.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p style={s.p}>
          We may update this policy. Material changes will be notified via email and a banner on the site at least 30 days in advance.
        </p>
      </Section>

      <div style={s.contact}>
        <b>Contact:</b> privacy@taxly.in · Taxly Technologies Pvt. Ltd., Bengaluru, Karnataka, India.
      </div>
    </StaticPageLayout>
  )
}

function Section({ title, children }) {
  return <div style={{ marginBottom: 36 }}><h2 style={{ fontSize: 18, fontWeight: 800, color: '#0D1117', marginBottom: 12 }}>{title}</h2>{children}</div>
}
const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  intro: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 36, background: '#F7F6F2', borderRadius: 12, padding: '20px 24px', borderLeft: '4px solid #0D7A5F' },
  p: { fontSize: 15, color: '#4A4F5C', lineHeight: 1.7, marginBottom: 12 },
  ul: { paddingLeft: 20, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.6 },
  link: { color: '#1B4FD8', textDecoration: 'underline' },
  contact: { background: '#F7F6F2', borderRadius: 12, padding: '16px 20px', fontSize: 14, color: '#4A4F5C', marginTop: 40 },
}
