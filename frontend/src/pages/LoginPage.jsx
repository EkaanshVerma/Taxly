import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/taxly'

function decodeJWT(token) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload))
}

export default function LoginPage() {
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [countdown, setCountdown] = useState(0)
  
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    if (localStorage.getItem('taxly_token')) {
      navigate('/dashboard')
    }
  }, [navigate])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      await sendOtp(email)
      setStep(2)
      setCountdown(30)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch (err) {
      setError("Couldn't send OTP. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the 6-digit OTP')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const res = await verifyOtp(email, otpString)
      const token = res.data.token
      const payload = decodeJWT(token)
      
      localStorage.setItem('taxly_token', token)
      localStorage.setItem('taxly_user_id', payload.user_id)
      
      navigate('/dashboard')
    } catch (err) {
      setError("Incorrect OTP. Try again.")
      setOtp(['', '', '', '', '', ''])
      otpRefs[0].current?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    if (value && index < 5) {
      otpRefs[index + 1].current?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '')
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      const nextFocus = pastedData.length < 6 ? pastedData.length : 5
      otpRefs[nextFocus].current?.focus()
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        
        <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: '28px', color: '#1e3a5f', letterSpacing: '-0.5px', marginBottom: '8px' }}>Taxly</div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Sign in to your account</h1>
        </div>
        
        <div style={{ padding: '32px' }}>
          {step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Email Address</label>
                <div style={{ display: 'flex', position: 'relative' }}>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Enter your email address" 
                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '15px', color: '#0f172a', outline: 'none', transition: 'border-color 0.2s' }} 
                    onFocus={e => e.target.style.borderColor = '#1e3a5f'} 
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                    autoFocus
                  />
                </div>
                {error && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px', fontWeight: 500 }}>{error}</div>}
              </div>
              
              <button 
                type="submit" 
                disabled={loading || !email} 
                style={{ width: '100%', padding: '12px', background: loading || !email ? '#94a3b8' : '#1e3a5f', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, color: '#ffffff', cursor: loading || !email ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>Enter OTP</label>
                  <button type="button" onClick={() => { setStep(1); setError(''); setEmail(''); }} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}>
                    &larr; Change email
                  </button>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                  Enter the 6-digit code sent to {email}
                </p>
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }} onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      style={{ width: '48px', height: '56px', textAlign: 'center', fontSize: '24px', fontWeight: 600, color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => { e.target.style.borderColor = '#1e3a5f'; e.target.select(); }}
                      onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                    />
                  ))}
                </div>
                {error && <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px', fontWeight: 500, textAlign: 'center' }}>{error}</div>}
              </div>
              
              <button 
                type="submit" 
                disabled={loading || otp.join('').length !== 6} 
                style={{ width: '100%', padding: '12px', background: loading || otp.join('').length !== 6 ? '#94a3b8' : '#1e3a5f', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, color: '#ffffff', cursor: loading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer', transition: 'background 0.2s', marginBottom: '16px' }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleSendOtp} 
                  disabled={countdown > 0 || loading} 
                  style={{ background: 'none', border: 'none', padding: 0, color: countdown > 0 ? '#94a3b8' : '#2563eb', fontSize: '13px', fontWeight: 500, cursor: countdown > 0 ? 'default' : 'pointer', textDecoration: countdown > 0 ? 'none' : 'underline' }}
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
        
      </div>
    </div>
  )
}
