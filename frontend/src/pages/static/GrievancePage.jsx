import React, { useState } from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function GrievancePage() {
  const [form, setForm] = useState({ name: '', email: '', type: '', subject: '', desc: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <StaticPageLayout title="Grievance / Data Deletion">
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0D1117', marginBottom: 12 }}>Grievance Received</h2>
        <p style={{ fontSize: 16, color: '#4A4F5C', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          We've received your request and will acknowledge it within <strong>24 hours</strong>. 
          Resolution happens within <strong>15 days</strong> as per IT Rules, 2021.
          A confirmation has been sent to <strong>{form.email}</strong>.
        </p>
      </div>
    </StaticPageLayout>
  )

  return (
    <StaticPageLayout title="Grievance Officer & Data Deletion">
      <p style={s.intro}>
        Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, 
        Taxly has appointed a Grievance Officer. You may contact them for any complaint, data deletion request, 
        or privacy concern.
      </p>

      {/* Officer card */}
      <div style={s.officerCard}>
        <div style={s.officerAvatar}>EV</div>
        <div>
          <div style={s.officerName}>Ekaansh Verma</div>
          <div style={s.officerRole}>Grievance Officer, Taxly</div>
          <div style={s.officerContact}>📧 <a href="mailto:grievance@taxly.in" style={s.link}>grievance@taxly.in</a></div>
          <div style={s.officerTimes}>Response within 24 hours · Resolution within 15 days</div>
        </div>
      </div>

      {/* Data deletion note */}
      <div style={s.deletionBox}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0D1117', marginBottom: 10 }}>Data Deletion Request</h3>
        <p style={{ fontSize: 14.5, color: '#4A4F5C', lineHeight: 1.7, margin: 0 }}>
          You may request deletion of your Taxly account and personal data at any time. Note that we are required 
          to retain filing data for 7 years under Section 44AA of the Income Tax Act. Non-filing data (chat history, 
          personal profile) will be deleted within 30 days of a valid request.
        </p>
      </div>

      {/* Grievance form */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0D1117', marginBottom: 20, marginTop: 40 }}>Submit a Grievance</h2>
      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.row}>
          <Field label="Your Name *" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Full name" required />
          <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
        </div>
        <div style={s.fieldWrap}>
          <label style={s.label}>Grievance Type *</label>
          <select name="type" value={form.type} onChange={handleChange} required style={s.input}>
            <option value="">Select type</option>
            <option value="data_deletion">Data Deletion Request</option>
            <option value="privacy">Privacy Concern</option>
            <option value="service">Service Complaint</option>
            <option value="incorrect_filing">Incorrect Filing / Tax Error</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Field label="Subject *" name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="Brief subject of your complaint" required />
        <div style={s.fieldWrap}>
          <label style={s.label}>Description *</label>
          <textarea name="desc" value={form.desc} onChange={handleChange} rows={5} required style={{ ...s.input, resize: 'vertical' }} placeholder="Please describe your grievance in detail, including any relevant dates, transaction IDs, or error messages." />
        </div>
        <button type="submit" style={s.submitBtn} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Grievance →'}
        </button>
        <p style={{ fontSize: 12.5, color: '#8A8FA3', marginTop: 10, textAlign: 'center' }}>
          We acknowledge all grievances within 24 hours and resolve them within 15 days, as per IT Rules 2021.
        </p>
      </form>
    </StaticPageLayout>
  )
}

function Field({ label, name, type, value, onChange, placeholder, required }) {
  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} style={s.input} />
    </div>
  )
}

const s = {
  intro: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.8, marginBottom: 32, maxWidth: 680 },
  officerCard: { display: 'flex', gap: 20, alignItems: 'center', background: '#F7F6F2', border: '1px solid #E5E2D9', borderRadius: 16, padding: 24, marginBottom: 28 },
  officerAvatar: { width: 56, height: 56, borderRadius: '50%', background: '#0D1117', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 },
  officerName: { fontSize: 18, fontWeight: 800, color: '#0D1117' },
  officerRole: { fontSize: 13.5, color: '#4A4F5C', marginBottom: 6 },
  officerContact: { fontSize: 14.5, marginBottom: 4 },
  officerTimes: { fontSize: 12.5, color: '#8A8FA3', fontStyle: 'italic' },
  link: { color: '#1B4FD8', textDecoration: 'underline' },
  deletionBox: { background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 14, padding: '20px 24px', marginBottom: 8 },
  form: { maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 18 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13.5, fontWeight: 600, color: '#1e293b' },
  input: { padding: '11px 14px', border: '1.5px solid #E5E2D9', borderRadius: 10, fontSize: 15, fontFamily: 'DM Sans, sans-serif', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
  submitBtn: { background: 'linear-gradient(135deg, #0B1A33, #0D7A5F)', color: '#fff', border: 'none', padding: '15px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
}
