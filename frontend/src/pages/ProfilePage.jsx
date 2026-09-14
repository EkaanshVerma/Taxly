import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useToast } from '../components/ToastContext'

export default function ProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState({ name: '', email: '', phone: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('taxly_token')) {
      navigate('/login')
      return
    }
    const stored = JSON.parse(localStorage.getItem('taxly_user') || '{}')
    setUser({
      name: stored.name || '',
      email: stored.email || localStorage.getItem('taxly_user_email') || '',
      phone: stored.phone || '',
    })
  }, [navigate])

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem('taxly_user', JSON.stringify(user))
    setSaved(true)
    toast.success('Profile saved!')
    setTimeout(() => setSaved(false), 2200)
  }

  function handleDeleteAccount() {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    localStorage.clear()
    toast.info('Account deleted. Redirecting…')
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="profile-root">
      <Navbar />
      <div className="profile-content">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your personal information and account settings.</p>
        </div>

        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="profile-name-display">{user.name || 'Your Name'}</div>
            <div className="profile-email-display">{user.email}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-card">
            <div className="profile-card-label">Personal Information</div>

            <div className="pf-group">
              <label htmlFor="pf-name">Full Name</label>
              <input
                id="pf-name"
                type="text"
                value={user.name}
                onChange={e => setUser(u => ({ ...u, name: e.target.value }))}
                placeholder="e.g. Arjun Sharma"
              />
            </div>
            <div className="pf-group">
              <label htmlFor="pf-email">Email Address</label>
              <input
                id="pf-email"
                type="email"
                value={user.email}
                disabled
                title="Email cannot be changed"
              />
              <span className="pf-hint">Email is linked to your OTP login and cannot be changed.</span>
            </div>
            <div className="pf-group">
              <label htmlFor="pf-phone">Mobile Number</label>
              <input
                id="pf-phone"
                type="tel"
                value={user.phone}
                onChange={e => setUser(u => ({ ...u, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <button type="submit" className="pf-save-btn" disabled={saved}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </form>

        {/* Danger zone */}
        <div className="profile-danger-card">
          <div className="profile-card-label" style={{ color: '#B91C1C' }}>Danger Zone</div>
          <div className="pf-danger-row">
            <div>
              <div className="pf-danger-title">Delete Account</div>
              <div className="pf-danger-sub">Permanently delete your account and all filing data. This cannot be undone.</div>
            </div>
            <button className="pf-delete-btn" onClick={handleDeleteAccount}>Delete Account</button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-root { min-height: 100vh; background: #F7F6F2; font-family: 'DM Sans', sans-serif; }
        .profile-content { max-width: 600px; margin: 0 auto; padding: 36px 20px 80px; display: flex; flex-direction: column; gap: 20px; }
        .profile-header h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .profile-header p { font-size: 15px; color: #64748b; }
        .profile-avatar-wrap { display: flex; align-items: center; gap: 18px; }
        .profile-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #0D7A5F, #0b6a50);
          color: #fff; font-size: 30px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .profile-name-display { font-size: 18px; font-weight: 700; color: #0f172a; }
        .profile-email-display { font-size: 14px; color: #64748b; }
        .profile-form { display: flex; flex-direction: column; gap: 16px; }
        .profile-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 18px; }
        .profile-card-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; }
        .pf-group { display: flex; flex-direction: column; gap: 6px; }
        .pf-group label { font-size: 13.5px; font-weight: 600; color: #374151; }
        .pf-group input {
          padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: border-color 0.2s;
        }
        .pf-group input:focus { border-color: #0D7A5F; }
        .pf-group input:disabled { background: #F8FAFC; color: #94a3b8; cursor: not-allowed; }
        .pf-hint { font-size: 12px; color: #94a3b8; }
        .pf-save-btn {
          background: linear-gradient(135deg, #0D7A5F, #0b6a50); color: #fff;
          border: none; padding: 15px; border-radius: 14px;
          font-size: 16px; font-weight: 700; cursor: pointer;
          transition: opacity 0.15s;
        }
        .pf-save-btn:hover { opacity: 0.9; }
        .pf-save-btn:disabled { background: #DCFCE7; color: #16a34a; cursor: default; }
        .profile-danger-card {
          background: #FFF5F5; border: 1.5px solid #FCA5A5;
          border-radius: 16px; padding: 24px;
        }
        .pf-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 12px; }
        .pf-danger-title { font-size: 15px; font-weight: 700; color: #991B1B; margin-bottom: 4px; }
        .pf-danger-sub { font-size: 13px; color: #B91C1C; line-height: 1.5; max-width: 340px; }
        .pf-delete-btn {
          background: #B91C1C; color: #fff; border: none;
          padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
          white-space: nowrap;
        }
        .pf-delete-btn:hover { background: #991B1B; }
      `}</style>
    </div>
  )
}
