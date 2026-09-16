import React, { useState } from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function ForCAsApplyPage() {
  const [form, setForm] = useState({ name: '', email: '', icai: '', phone: '', city: '', clients: '', note: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    // In prod: POST to /api/ca-apply
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <StaticPageLayout title="Application Received">
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0D1117', marginBottom: 12 }}>
          Thank you, {form.name.split(' ')[0]}!
        </h2>
        <p style={{ fontSize: 16, color: '#4A4F5C', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          We've received your CA partner application. Our team will verify your ICAI registration and 
          reach out to <strong>{form.email}</strong> within 48 hours.
        </p>
      </div>
    </StaticPageLayout>
  )

  return (
    <StaticPageLayout title="Apply as a CA Partner">
      <p style={{ fontSize: 17, color: '#4A4F5C', maxWidth: 560, margin: '0 auto 40px', textAlign: 'center', lineHeight: 1.7 }}>
        Join Taxly's CA network. Earn ₹500–₹2,000 per filing while Taxly handles client acquisition and AI data collection.
      </p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <Field label="Full Name *" name="name" type="text" value={form.name} onChange={handleChange} placeholder="CA Rajesh Kumar" required />
          <Field label="ICAI Membership Number *" name="icai" type="text" value={form.icai} onChange={handleChange} placeholder="e.g. 123456" required />
        </div>
        <div style={styles.row}>
          <Field label="Email Address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="rajesh@caoffice.com" required />
          <Field label="Phone Number *" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
        </div>
        <div style={styles.row}>
          <Field label="City" name="city" type="text" value={form.city} onChange={handleChange} placeholder="Mumbai" />
          <div style={styles.fieldWrap}>
            <label style={styles.label}>Current clients (approx.)</label>
            <select name="clients" value={form.clients} onChange={handleChange} style={styles.input}>
              <option value="">Select range</option>
              <option value="<25">&lt;25</option>
              <option value="25-100">25–100</option>
              <option value="100-500">100–500</option>
              <option value="500+">500+</option>
            </select>
          </div>
        </div>
        <div style={styles.fieldWrap}>
          <label style={styles.label}>Anything you'd like to tell us?</label>
          <textarea name="note" value={form.note} onChange={handleChange} rows={4} style={{ ...styles.input, resize: 'vertical' }} placeholder="Your practice focus, questions about the platform, etc." />
        </div>
        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Application →'}
        </button>
        <p style={{ fontSize: 13, color: '#8A8FA3', textAlign: 'center', marginTop: 12 }}>
          We typically respond within 48 hours. Your ICAI number will be verified before onboarding.
        </p>
      </form>
    </StaticPageLayout>
  )
}

function Field({ label, name, type, value, onChange, placeholder, required }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} style={styles.input} />
    </div>
  )
}

const styles = {
  form: { maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13.5, fontWeight: 600, color: '#1e293b' },
  input: {
    padding: '12px 14px', border: '1.5px solid #E5E2D9', borderRadius: 10,
    fontSize: 15, fontFamily: 'DM Sans, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', background: '#fff', width: '100%', boxSizing: 'border-box'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #0D7A5F, #0b6a50)', color: '#fff',
    border: 'none', padding: '16px', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8,
    boxShadow: '0 4px 20px rgba(13,122,95,0.25)'
  }
}
