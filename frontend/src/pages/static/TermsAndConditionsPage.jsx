import React from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function TermsAndConditionsPage() {
  return (
    <StaticPageLayout title="Terms and Conditions">
      <div style={s.meta}>Last updated: June 15, 2025 · Effective: July 1, 2025</div>
      <p style={s.intro}>
        Please read these Terms carefully before using Taxly. By creating an account or using the service, 
        you agree to be bound by these Terms.
      </p>

      {[
        ['1. The Service', `Taxly provides an AI-assisted income tax filing service for Indian taxpayers. The service includes:
(a) An AI chat interface that collects your tax-relevant information;
(b) Automated computation of income tax liability under applicable Indian tax law;
(c) CA review of the computed return;
(d) Generation of an ITR XML file for upload to the Income Tax Department e-filing portal.

Taxly is a technology platform and is not itself a registered Chartered Accountant firm. CA review is performed by independent, ICAI-registered CAs on the Taxly network.`],

        ['2. Eligibility', `You must be at least 18 years old to use Taxly. The service is intended for Indian tax residents. NRIs and those with complex cross-border tax situations should select the Pro/NRI tier and ensure full disclosure of foreign assets.`],

        ['3. Your responsibilities', `You are responsible for:
(a) Providing accurate and complete information during the AI filing session;
(b) Verifying your Annual Information Statement (AIS) on the ITD portal before filing;
(c) Uploading the final ITR XML to the Income Tax Department portal yourself;
(d) Any penalties arising from incorrect or incomplete information you provided.

Taxly and the reviewing CA are not liable for errors caused by incomplete or false information provided by you.`],

        ['4. Payment and refunds', `Filing fees are charged as per the current pricing page. Payment is processed via Razorpay. Fees are non-refundable once your ITR XML has been generated and delivered.

Taxly offers a 7-day money-back guarantee if you are not satisfied with the service before XML generation. To claim a refund, email refund@taxly.in within 7 days of payment. See our Refund Policy for full terms.`],

        ['5. CA review scope', `CA review is a professional review of the AI-generated computation. It does not constitute:
(a) Tax advice or financial planning;
(b) Representation before tax authorities;
(c) Audit defense or legal representation.

For notices received after filing, Taxly Premium and Pro tiers include a 90-day notice response window.`],

        ['6. Limitation of liability', `To the maximum extent permitted by Indian law, Taxly's total liability for any claim arising out of or relating to this service is limited to the fees paid by you for the specific filing in question.

Taxly is not liable for: (a) late filing penalties if you do not upload your XML before the deadline; (b) tax demands arising from information mismatches that you did not disclose; (c) ITD portal downtime or processing delays.`],

        ['7. Intellectual property', `The Taxly platform, AI models, and all content are owned by Taxly Technologies Pvt. Ltd. You may not reverse-engineer, copy, or redistribute any part of the service.`],

        ['8. Governing law', `These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.`],

        ['9. Contact', `Legal notices: legal@taxly.in · Taxly Technologies Pvt. Ltd., Bengaluru, Karnataka, India`],
      ].map(([title, body], i) => (
        <div key={i} style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0D1117', marginBottom: 12 }}>{title}</h2>
          <p style={{ fontSize: 15, color: '#4A4F5C', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
        </div>
      ))}
    </StaticPageLayout>
  )
}

const s = {
  meta: { fontSize: 13, color: '#8A8FA3', marginBottom: 20 },
  intro: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 36, background: '#F7F6F2', borderRadius: 12, padding: '20px 24px', borderLeft: '4px solid #1B4FD8' },
}
