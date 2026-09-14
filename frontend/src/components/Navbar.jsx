import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useToast } from './ToastContext'

export default function Navbar({ activeSessionId = null }) {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const token = localStorage.getItem('taxly_token')
  let userEmail = 'user@taxly.in'
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userEmail = payload.email || payload.sub || userEmail
    }
  } catch (e) {
    // fallback
  }

  const handleLogout = () => {
    localStorage.removeItem('taxly_token')
    localStorage.removeItem('taxly_session_id')
    toast.info('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="app-navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          <img src="/logo-color.png" alt="Taxly" className="navbar-logo" onError={(e) => { e.target.src = '/logo.png' }} />
        </Link>

        <nav className="navbar-links">
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/documents" className={`nav-item ${location.pathname === '/documents' ? 'active' : ''}`}>
            Documents
          </Link>
          <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            Profile
          </Link>
        </nav>

        <div className="navbar-right">
          {activeSessionId && (
            <button className="btn-resume-filing" onClick={() => navigate(`/chat/${activeSessionId}`)}>
              Continue Filing →
            </button>
          )}

          <div className="user-dropdown-wrap">
            <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span className="user-initial">{userEmail[0].toUpperCase()}</span>
              <span className="user-email-text">{userEmail}</span>
              <span className="dropdown-arrow">▾</span>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-user-header">
                  <div className="dh-email">{userEmail}</div>
                  <div className="dh-badge">Filer Account</div>
                </div>
                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Account Settings
                </Link>
                <Link to="/documents" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  Tax Documents &amp; XMLs
                </Link>
                <div className="dropdown-divider" />
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .app-navbar {
          background: #fff;
          border-bottom: 1px solid var(--paper-3, #E5E2D9);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: var(--sans, 'DM Sans', sans-serif);
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-brand { display: flex; align-items: center; text-decoration: none; }
        .navbar-logo { height: 48px; object-fit: contain; }
        .navbar-links { display: flex; gap: 24px; align-items: center; }
        .nav-item {
          text-decoration: none;
          color: var(--ink-2, #4A4F5C);
          font-weight: 500;
          font-size: 14.5px;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .nav-item:hover { color: var(--ink, #0D1117); background: var(--paper-2, #EFEDE7); }
        .nav-item.active { color: var(--blue, #1B4FD8); font-weight: 600; background: var(--blue-light, #EEF2FF); }
        
        .navbar-right { display: flex; align-items: center; gap: 16px; position: relative; }
        .btn-resume-filing {
          background: var(--green, #0D7A5F);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-resume-filing:hover { background: #0a634d; transform: translateY(-1px); }

        .user-dropdown-wrap { position: relative; }
        .user-avatar-btn {
          background: var(--paper-2, #EFEDE7);
          border: 1px solid var(--paper-3, #E5E2D9);
          border-radius: 999px;
          padding: 4px 12px 4px 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .user-avatar-btn:hover { border-color: var(--ink-3, #8B909A); }
        .user-initial {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--navy-deep, #0B1A33);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .user-email-text { font-size: 13.5px; color: var(--ink, #0D1117); font-weight: 500; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dropdown-arrow { font-size: 11px; color: var(--ink-3); }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #fff;
          border: 1px solid var(--paper-3, #E5E2D9);
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          width: 220px;
          padding: 8px 0;
          z-index: 200;
          animation: dropFade 0.2s ease-out;
        }
        .dropdown-user-header {
          padding: 10px 16px;
          border-bottom: 1px solid var(--paper-2);
        }
        .dh-email { font-size: 13px; font-weight: 600; color: var(--ink); word-break: break-all; }
        .dh-badge { font-size: 11px; color: var(--green); font-weight: 600; margin-top: 2px; }
        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          font-size: 13.5px;
          color: var(--ink-2);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .dropdown-item:hover { background: var(--paper-2); color: var(--ink); }
        .dropdown-divider { height: 1px; background: var(--paper-3); margin: 6px 0; }
        .text-danger { color: #B91C1C !important; }
        .text-danger:hover { background: #FEF2F2 !important; }

        @keyframes dropFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .navbar-container { padding: 10px 16px; }
          .user-email-text { display: none; }
          .navbar-links { gap: 8px; }
        }
      `}</style>
    </header>
  )
}
