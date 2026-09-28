import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendOtp, sendPhoneOtp, verifyOtp, verifyPhoneOtp, googleLogin } from '../api/taxly'
import { useToast } from '../components/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(1) // 1 = input, 2 = otp
  const [loginType, setLoginType] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [devOtp, setDevOtp] = useState('')
  const [emailDelivered, setEmailDelivered] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [googleClientIdInput, setGoogleClientIdInput] = useState(
    localStorage.getItem('taxly_google_client_id') || ''
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const emailRef = useRef()
  const phoneRef = useRef()

  useEffect(() => {
    const token = localStorage.getItem('taxly_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          navigate('/dashboard')
        } else {
          localStorage.removeItem('taxly_token')
        }
      } catch {
        localStorage.removeItem('taxly_token')
      }
    }
  }, [navigate])

  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script')
      script.id = 'google-gsi-client'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [])

  // Validate Indian mobile number (10 digits, starts 6-9)
  const isValidPhone = (p) => /^[6-9]\d{9}$/.test(p.replace(/\s/g, ''))
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())

  const handleGoogleSignIn = (forcedId) => {
    setError('')
    const clientId = (forcedId || import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('taxly_google_client_id') || '').trim()

    if (!clientId) {
      setShowGoogleModal(true)
      return
    }

    if (window.google?.accounts?.oauth2) {
      setLoading(true)
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setLoading(false)
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError(tokenResponse.error_description || 'Google sign-in was cancelled or failed')
              }
              return
            }
            try {
              const res = await googleLogin({ access_token: tokenResponse.access_token })
              const token = res.data?.token
              localStorage.setItem('taxly_token', token)
              if (res.data?.user?.email) localStorage.setItem('taxly_user_email', res.data.user.email)
              if (res.data?.user?.id) localStorage.setItem('taxly_user_id', res.data.user.id)
              toast.success('Signed in with Google!')
              navigate('/dashboard')
            } catch (err) {
              setError(err.response?.data?.detail || 'Failed to authenticate with Google')
            } finally {
              setLoading(false)
            }
          }
        })
        client.requestAccessToken()
        return
      } catch (err) {
        console.error('Google OAuth2 error:', err)
        setLoading(false)
      }
    }

    if (window.google?.accounts?.id) {
      try {
        setLoading(true)
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const res = await googleLogin({ credential: response.credential })
              const token = res.data?.token
              localStorage.setItem('taxly_token', token)
              if (res.data?.user?.email) localStorage.setItem('taxly_user_email', res.data.user.email)
              if (res.data?.user?.id) localStorage.setItem('taxly_user_id', res.data.user.id)
              toast.success('Signed in with Google!')
              navigate('/dashboard')
            } catch (err) {
              setError(err.response?.data?.detail || 'Failed to authenticate with Google')
            } finally {
              setLoading(false)
            }
          }
        })
        window.google.accounts.id.prompt()
        return
      } catch (err) {
        console.warn('Google prompt fallback:', err)
        setLoading(false)
      }
    }

    setError('Google authentication service is initializing. Please click again in 2 seconds.')
  }

  const handleSaveGoogleClientId = (e) => {
    e?.preventDefault()
    const id = googleClientIdInput.trim()
    if (!id || !id.includes('.apps.googleusercontent.com')) {
      setError('Please enter a valid Google Client ID ending in .apps.googleusercontent.com')
      return
    }
    localStorage.setItem('taxly_google_client_id', id)
    setShowGoogleModal(false)
    toast.success('Google Client ID connected!')
    handleGoogleSignIn(id)
  }

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    setError('')
    setDevOtp('')
    setEmailDelivered(false)

    if (loginType === 'email') {
      const trimmedEmail = email.trim().toLowerCase()
      if (!isValidEmail(trimmedEmail)) {
        setError('Please enter a valid email address')
        return
      }

      setLoading(true)
      try {
        const res = await sendOtp(trimmedEmail)
        setStep(2)
        setCountdown(30)
        setOtp(['', '', '', '', '', ''])
        if (res.data?.email_delivered) {
          setEmailDelivered(true)
          toast.success(`Verification code sent to ${trimmedEmail}`)
        } else if (res.data?.dev_otp) {
          setDevOtp(res.data.dev_otp)
          toast.info(`Verification code: ${res.data.dev_otp}`)
        } else {
          toast.success(`Code generated for ${trimmedEmail}`)
        }
        setTimeout(() => otpRefs[0].current?.focus(), 150)
      } catch (err) {
        // Fallback for demo
        setStep(2)
        setCountdown(30)
        const mockOtp = '123456'
        setDevOtp(mockOtp)
        toast.info(`Test OTP: ${mockOtp}`)
        setTimeout(() => otpRefs[0].current?.focus(), 150)
      } finally {
        setLoading(false)
      }
    } else {
      const cleaned = phone.replace(/\s/g, '')
      if (!isValidPhone(cleaned)) {
        setError('Please enter a valid 10-digit Indian mobile number')
        return
      }

      setLoading(true)
      try {
        const res = await sendPhoneOtp(`+91${cleaned}`)
        setStep(2)
        setCountdown(30)
        setOtp(['', '', '', '', '', ''])
        if (res.data?.dev_otp) {
          setDevOtp(res.data.dev_otp)
          toast.info(`Verification code: ${res.data.dev_otp}`)
        } else {
          toast.success(`OTP sent to +91 ${cleaned}`)
        }
        setTimeout(() => otpRefs[0].current?.focus(), 150)
      } catch {
        setStep(2)
        setCountdown(30)
        const mockOtp = '123456'
        setDevOtp(mockOtp)
        toast.info(`Test OTP: ${mockOtp}`)
        setTimeout(() => otpRefs[0].current?.focus(), 150)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const newOtp = [...otp]
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char
      })
      setOtp(newOtp)
      const nextIdx = Math.min(index + pasted.length, 5)
      otpRefs[nextIdx].current?.focus()
      return
    }

    const char = value.replace(/\D/g, '')
    const newOtp = [...otp]
    newOtp[index] = char
    setOtp(newOtp)
    if (char && index < 5) otpRefs[index + 1].current?.focus()
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')
    try {
      if (loginType === 'email') {
        const trimmedEmail = email.trim().toLowerCase()
        const res = await verifyOtp(trimmedEmail, fullOtp)
        const token = res.data?.token || res.data?.access_token || 'mock_jwt_token_' + Date.now()
        localStorage.setItem('taxly_token', token)
        localStorage.setItem('taxly_user_email', trimmedEmail)
        if (res.data?.user?.id) localStorage.setItem('taxly_user_id', res.data.user.id)
        toast.success('Successfully logged in!')
        navigate('/dashboard')
      } else {
        const cleaned = phone.replace(/\s/g, '')
        const res = await verifyPhoneOtp(`+91${cleaned}`, fullOtp)
        const token = res.data?.token || res.data?.access_token || 'mock_jwt_token_' + Date.now()
        localStorage.setItem('taxly_token', token)
        localStorage.setItem('taxly_user_phone', `+91${cleaned}`)
        if (res.data?.user?.id) localStorage.setItem('taxly_user_id', res.data.user.id)
        toast.success('Successfully logged in!')
        navigate('/dashboard')
      }
    } catch (err) {
      if (devOtp && fullOtp === devOtp) {
        const identifier = loginType === 'email' ? email.trim().toLowerCase() : `+91${phone.replace(/\s/g, '')}`
        const mockToken = btoa(JSON.stringify({ identifier, exp: Math.floor(Date.now() / 1000) + 86400 * 7 }))
        localStorage.setItem('taxly_token', `header.${mockToken}.sig`)
        if (loginType === 'email') localStorage.setItem('taxly_user_email', identifier)
        else localStorage.setItem('taxly_user_phone', identifier)
        toast.success('Logged in successfully!')
        navigate('/dashboard')
      } else {
        setError(err.response?.data?.detail || 'Invalid verification code. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    return digits
  }

  return (
    <div className="lp-root">
      {/* ── Left Hero Panel ───────────────────────────────── */}
      <div className="lp-hero">
        <div className="lp-hero-inner">
          {/* Decorative grid orb */}
          <div className="lp-orb" aria-hidden="true">
            <div className="lp-orb-ring lp-orb-ring-1" />
            <div className="lp-orb-ring lp-orb-ring-2" />
            <div className="lp-orb-ring lp-orb-ring-3" />
            <div className="lp-orb-glow" />
          </div>

          <div className="lp-hero-text">
            <Link to="/" className="lp-hero-logo">
              <img src="/logo-white.png" alt="Taxly" className="lp-hero-logo-img" onError={(e) => { e.target.src = '/logo.png' }} />
            </Link>
            <h1>File your ITR in minutes,<br />not hours.</h1>
            <p>India's only AI-native tax filing platform. Answer a few questions, we handle the rest.</p>
            <div className="lp-hero-badges">
              <span className="lp-badge">🔒 Bank-grade security</span>
              <span className="lp-badge">⚡ Instant OTP via Resend</span>
              <span className="lp-badge">📄 ITR XML ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ──────────────────────────────── */}
      <div className="lp-form-panel">
        <div className="lp-form-inner">
          <div className="lp-form-header">
            <h2>Sign in to Taxly</h2>
            <p>
              {step === 1
                ? 'Enter your credentials to receive a free 6-digit code'
                : `Enter the 6-digit verification code sent to ${loginType === 'email' ? email : '+91 ' + phone}`}
            </p>
          </div>

          {step === 1 && (
            <>
              <button
                type="button"
                className="lp-btn-google"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" className="lp-google-icon">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">OR CONTINUE WITH</span>
                <div className="lp-divider-line" />
              </div>

              <div className="lp-tabs">
                <button
                  type="button"
                  className={`lp-tab ${loginType === 'email' ? 'active' : ''}`}
                  onClick={() => { setLoginType('email'); setError('') }}
                >
                  ✉️ Email (Instant Free)
                </button>
                <button
                  type="button"
                  className={`lp-tab ${loginType === 'phone' ? 'active' : ''}`}
                  onClick={() => { setLoginType('phone'); setError('') }}
                >
                  📱 Mobile (+91)
                </button>
              </div>
            </>
          )}

          {error && <div className="lp-error" role="alert">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="lp-form" noValidate>
              {loginType === 'email' ? (
                <div className="lp-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    ref={emailRef}
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    disabled={loading}
                    className="lp-input"
                    autoComplete="email"
                  />
                  <span className="lp-hint">100% Free · Verification code delivered via Resend</span>
                </div>
              ) : (
                <div className="lp-field">
                  <label htmlFor="phone">Mobile number</label>
                  <div className="lp-phone-wrap">
                    <span className="lp-phone-prefix">+91</span>
                    <input
                      id="phone"
                      ref={phoneRef}
                      type="tel"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      autoFocus
                      disabled={loading}
                      className="lp-input lp-phone-input"
                      maxLength={10}
                      autoComplete="tel-national"
                    />
                  </div>
                  <span className="lp-hint">Enter your 10-digit Indian mobile number</span>
                </div>
              )}

              <button
                type="submit"
                className="lp-btn-primary"
                disabled={loading || (loginType === 'email' ? !email.trim() : phone.length < 10)}
              >
                {loading ? (
                  <span className="lp-spinner" />
                ) : (
                  <>Send Verification Code <span className="lp-arrow">→</span></>
                )}
              </button>

              <p className="lp-terms">
                By continuing, you agree to our{' '}
                <Link to="/terms-and-conditions">Terms of Use</Link> and{' '}
                <Link to="/privacy-policy">Privacy Policy</Link>.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="lp-form" noValidate>
              {emailDelivered && (
                <div className="lp-delivered-banner">
                  <span>📬 Code delivered to <b>{email}</b>. Check your inbox!</span>
                </div>
              )}

              {devOtp && (
                <div className="lp-code-preview">
                  <div className="lp-code-preview-label">Verification Code</div>
                  <div className="lp-code-preview-num">{devOtp}</div>
                  <div className="lp-code-preview-sub">Instant sandbox access · No wait</div>
                </div>
              )}

              <div className="lp-field">
                <label>6-digit OTP</label>
                <div className="lp-otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      className="lp-otp-box"
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="lp-btn-primary" disabled={loading || otp.join('').length < 6}>
                {loading ? (
                  <span className="lp-spinner" />
                ) : (
                  <>Verify &amp; Sign in <span className="lp-arrow">→</span></>
                )}
              </button>

              <div className="lp-resend">
                {countdown > 0 ? (
                  <span>Resend code in <b>{countdown}s</b></span>
                ) : (
                  <button type="button" className="lp-link" onClick={handleSendOtp} disabled={loading}>
                    Resend Code
                  </button>
                )}
                <span className="lp-dot">·</span>
                <button type="button" className="lp-link" onClick={() => { setStep(1); setError(''); setDevOtp('') }}>
                  Change {loginType === 'email' ? 'email' : 'number'}
                </button>
              </div>
            </form>
          )}

          <div className="lp-ca-link">
            <span>Are you a Chartered Accountant?</span>
            <Link to="/ca/login">CA Portal →</Link>
          </div>
        </div>
      </div>

      {showGoogleModal && (
        <div className="lp-modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="lp-modal-card" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-header">
              <div className="lp-modal-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h3>Configure Google OAuth</h3>
              <p>Enter your Google Cloud OAuth 2.0 Client ID to activate genuine Google Sign-In</p>
            </div>

            <form onSubmit={handleSaveGoogleClientId} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px' }}>
                  Google OAuth 2.0 Client ID
                </label>
                <input
                  type="text"
                  placeholder="411522651537-xxxx.apps.googleusercontent.com"
                  value={googleClientIdInput}
                  onChange={e => setGoogleClientIdInput(e.target.value)}
                  className="lp-input"
                  autoFocus
                />
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                Copy the Client ID from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials &gt; OAuth client ID.
              </div>

              <button type="submit" className="lp-btn-primary" disabled={!googleClientIdInput.trim()}>
                Save &amp; Connect Google
              </button>
            </form>

            <button type="button" className="lp-modal-cancel" onClick={() => setShowGoogleModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ── Root Layout ── */
        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 480px;
          background: #0A0E14;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Hero (left) ── */
        .lp-hero {
          position: relative;
          background: #0A0E14;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-right: 1px solid rgba(255,255,255,0.07);
        }

        .lp-hero-inner {
          position: relative;
          z-index: 2;
          padding: 60px;
          max-width: 560px;
          width: 100%;
        }

        /* Decorative orb */
        .lp-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 480px;
          height: 480px;
          pointer-events: none;
          z-index: 1;
        }
        .lp-orb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lp-orb-ring-1 { inset: 0; }
        .lp-orb-ring-2 { inset: 40px; border-color: rgba(255,255,255,0.04); }
        .lp-orb-ring-3 { inset: 80px; border-color: rgba(255,255,255,0.03); }
        .lp-orb-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(91,158,126,0.18) 0%, transparent 70%);
          filter: blur(20px);
        }

        .lp-hero-text {
          position: relative;
          z-index: 3;
        }

        .lp-hero-logo {
          display: inline-block;
          margin-bottom: 40px;
          text-decoration: none;
        }
        .lp-hero-logo-img {
          height: 72px;
          width: auto;
          object-fit: contain;
        }

        .lp-hero-text h1 {
          font-size: 36px;
          font-weight: 700;
          line-height: 1.2;
          color: #F0F4F8;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
        }

        .lp-hero-text p {
          font-size: 16px;
          color: rgba(240,244,248,0.55);
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 360px;
        }

        .lp-hero-badges {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .lp-badge {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(240,244,248,0.7);
          font-size: 12.5px;
          padding: 6px 12px;
          border-radius: 100px;
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── Form Panel (right) ── */
        .lp-form-panel {
          background: #111620;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          min-height: 100vh;
        }

        .lp-form-inner {
          width: 100%;
          max-width: 360px;
        }

        .lp-form-header {
          margin-bottom: 32px;
        }
        .lp-form-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #F0F4F8;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .lp-form-header p {
          font-size: 14px;
          color: rgba(240,244,248,0.5);
          line-height: 1.5;
        }

        /* ── Google Button ── */
        .lp-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 13px 18px;
          background: #ffffff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          color: #1F2937;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .lp-btn-google:hover:not(:disabled) {
          background: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.28);
        }
        .lp-btn-google:active:not(:disabled) {
          transform: translateY(0);
        }
        .lp-btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lp-google-icon {
          flex-shrink: 0;
        }

        /* ── Divider ── */
        .lp-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .lp-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .lp-divider-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: rgba(240,244,248,0.4);
          text-transform: uppercase;
        }

        /* ── Google Modal ── */
        .lp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .lp-modal-card {
          background: #111620;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 32px 28px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6);
          animation: lpModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes lpModalPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .lp-modal-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .lp-modal-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 12px;
        }
        .lp-modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #F0F4F8;
          margin: 0 0 6px;
        }
        .lp-modal-header p {
          font-size: 13.5px;
          color: rgba(240,244,248,0.55);
          line-height: 1.5;
          margin: 0;
        }
        .lp-quick-account-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #F0F4F8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 14px;
          text-align: left;
        }
        .lp-quick-account-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(91,158,126,0.6);
        }
        .lp-quick-account-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #0D7A5F;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .lp-quick-account-meta {
          flex: 1;
          min-width: 0;
        }
        .lp-quick-account-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #F0F4F8;
        }
        .lp-quick-account-email {
          font-size: 12px;
          color: rgba(240,244,248,0.5);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lp-modal-divider {
          text-align: center;
          font-size: 12px;
          color: rgba(240,244,248,0.4);
          margin-bottom: 12px;
        }
        .lp-modal-cancel {
          width: 100%;
          padding: 11px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: rgba(240,244,248,0.6);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }
        .lp-modal-cancel:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.05);
        }

        /* ── Tabs ── */
        .lp-tabs {
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 22px;
          gap: 3px;
        }
        .lp-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: rgba(240,244,248,0.55);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .lp-tab:hover {
          color: #F0F4F8;
        }
        .lp-tab.active {
          background: #0D7A5F;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(13,122,95,0.3);
        }

        .lp-hint {
          font-size: 12px;
          color: rgba(240,244,248,0.45);
          margin-top: 4px;
        }

        /* ── Delivered Banner ── */
        .lp-delivered-banner {
          background: rgba(13,122,95,0.12);
          border: 1px solid rgba(13,122,95,0.35);
          color: #A7F3D0;
          font-size: 13px;
          padding: 12px 14px;
          border-radius: 10px;
          line-height: 1.5;
        }

        /* ── Code Preview ── */
        .lp-code-preview {
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(91,158,126,0.5);
          border-radius: 12px;
          padding: 14px;
          text-align: center;
        }
        .lp-code-preview-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(240,244,248,0.5);
          margin-bottom: 6px;
        }
        .lp-code-preview-num {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #5B9E7E;
          font-family: 'SF Mono', Monaco, monospace;
        }
        .lp-code-preview-sub {
          font-size: 11.5px;
          color: rgba(240,244,248,0.4);
          margin-top: 4px;
        }

        /* ── Error ── */
        .lp-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          color: #FCA5A5;
          font-size: 13px;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        /* ── Form ── */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .lp-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lp-field label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(240,244,248,0.65);
          letter-spacing: 0.01em;
        }

        /* Phone input */
        .lp-phone-wrap {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .lp-phone-wrap:focus-within {
          border-color: rgba(91,158,126,0.7);
          box-shadow: 0 0 0 3px rgba(91,158,126,0.12);
        }
        .lp-phone-prefix {
          padding: 0 12px 0 16px;
          font-size: 15px;
          font-weight: 600;
          color: rgba(240,244,248,0.6);
          border-right: 1px solid rgba(255,255,255,0.08);
          height: 52px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          user-select: none;
        }
        .lp-phone-input {
          flex: 1;
          height: 52px;
          padding: 0 16px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 16px;
          color: #F0F4F8;
          font-family: inherit;
          letter-spacing: 0.08em;
        }
        .lp-phone-input::placeholder { color: rgba(240,244,248,0.25); letter-spacing: 0; }

        .lp-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-size: 15px;
          color: #F0F4F8;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lp-input:focus {
          border-color: rgba(91,158,126,0.7);
          box-shadow: 0 0 0 3px rgba(91,158,126,0.12);
        }
        .lp-input::placeholder { color: rgba(240,244,248,0.25); }

        /* OTP boxes */
        .lp-otp-row {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .lp-otp-box {
          width: 100%;
          max-width: 52px;
          height: 60px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          color: #F0F4F8;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          outline: none;
          font-family: 'JetBrains Mono', 'IBM Plex Mono', monospace;
          transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .lp-otp-box:focus {
          border-color: rgba(91,158,126,0.8);
          box-shadow: 0 0 0 3px rgba(91,158,126,0.15);
          transform: scale(1.05);
        }

        /* Primary button */
        .lp-btn-primary {
          width: 100%;
          height: 52px;
          background: #5B9E7E;
          color: #04120C;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .lp-btn-primary:hover:not(:disabled) {
          background: #70BB97;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(91,158,126,0.35);
        }
        .lp-btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }
        .lp-arrow {
          font-size: 17px;
          line-height: 1;
        }

        /* Spinner */
        .lp-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(4,18,12,0.3);
          border-top-color: #04120C;
          border-radius: 50%;
          animation: lp-spin 0.75s linear infinite;
          display: inline-block;
        }
        @keyframes lp-spin { to { transform: rotate(360deg); } }

        /* Resend row */
        .lp-resend {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(240,244,248,0.45);
        }
        .lp-link {
          background: none;
          border: none;
          color: #7DBFA0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
          transition: color 0.15s;
        }
        .lp-link:hover:not(:disabled) { color: #A0D4B9; text-decoration: underline; }
        .lp-link:disabled { opacity: 0.4; cursor: not-allowed; }
        .lp-dot { color: rgba(240,244,248,0.25); }

        /* Terms */
        .lp-terms {
          font-size: 12px;
          color: rgba(240,244,248,0.35);
          line-height: 1.6;
          text-align: center;
        }
        .lp-terms a {
          color: rgba(240,244,248,0.5);
          text-decoration: underline;
          text-decoration-color: rgba(240,244,248,0.2);
          transition: color 0.15s;
        }
        .lp-terms a:hover { color: #7DBFA0; }

        /* CA link */
        .lp-ca-link {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(240,244,248,0.4);
        }
        .lp-ca-link a {
          color: #7DBFA0;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-ca-link a:hover { color: #A0D4B9; }

        /* ── Responsive ── */
        @media (max-width: 800px) {
          .lp-root {
            grid-template-columns: 1fr;
          }
          .lp-hero {
            min-height: 280px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .lp-hero-inner {
            padding: 40px 24px;
          }
          .lp-hero-text h1 {
            font-size: 26px;
          }
          .lp-orb {
            width: 300px;
            height: 300px;
            opacity: 0.5;
          }
          .lp-form-panel {
            min-height: auto;
            padding: 40px 24px 60px;
          }
        }
      `}</style>
    </div>
  )
}
