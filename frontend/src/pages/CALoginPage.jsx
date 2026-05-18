import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { caLogin, caRegister } from '../api/ca'

export default function CALoginPage({ setCAToken }) {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await caRegister(form.name, form.email, form.phone, form.password)
        const res = await caLogin(form.email, form.password)
        setCAToken(res.data.token)
        navigate('/ca/dashboard')
      } else {
        const res = await caLogin(form.email, form.password)
        setCAToken(res.data.token)
        navigate('/ca/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <div style={{ width: '100%', padding: '20px 40px', display: 'flex', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '24px', color: '#1e3a5f', letterSpacing: '-0.5px' }}>Taxly</div>
        <div style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px' }}>CA Portal</div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0', width: '100%', maxWidth: '420px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', textAlign: 'center' }}>
            {isRegister ? 'Create CA Account' : 'CA Partner Login'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>
            {isRegister ? 'Register to manage your clients securely' : 'Sign in to access your dashboard'}
          </p>
          
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', border: '1px solid #fecaca' }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Phone (Optional)</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Email Address</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
            </div>
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#1e3a5f', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background 0.2s' }} onMouseOver={e => !loading && (e.target.style.background = '#152943')} onMouseOut={e => !loading && (e.target.style.background = '#1e3a5f')}>
              {loading ? 'Please wait...' : (isRegister ? 'Register Account' : 'Sign In')}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', fontSize: '14px', color: '#64748b' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button style={{ border: 'none', background: 'transparent', color: '#1e3a5f', fontWeight: 500, cursor: 'pointer', padding: 0 }} onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Log in' : 'Register here'}
            </button>
          </div>
        </div>
        
        <div style={{ marginTop: '40px', fontSize: '13px', color: '#94a3b8' }}>
          Powered by Taxly
        </div>
      </div>
    </div>
  )
}
