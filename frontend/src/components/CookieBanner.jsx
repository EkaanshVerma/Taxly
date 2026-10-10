import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './CookieBanner.css'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem('taxly_cookie_consent')
    if (!consent) {
      // Delay slightly for smooth entrance animation after initial page load
      const timer = setTimeout(() => {
        setIsVisible(true)
        // Trigger entrance transition
        requestAnimationFrame(() => {
          setIsEntering(false)
        })
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissWithConsent = (consentType) => {
    try {
      localStorage.setItem('taxly_cookie_consent', consentType)
    } catch {
      // localStorage may fail in private mode
    }
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 350)
  }

  if (!isVisible) return null

  return (
    <aside
      className="cookie-banner-container"
      role="region"
      aria-label="Cookie preferences"
    >
      <div
        className={`cookie-banner-card ${isEntering ? 'entering' : ''} ${isExiting ? 'exiting' : ''}`}
      >
        <div className="cookie-banner-header">
          <div className="cookie-banner-title-wrap">
            <div className="cookie-banner-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01" />
                <path d="M7 15v.01" />
                <path d="M11 17v.01" />
                <path d="M16 14v.01" />
              </svg>
            </div>
            <span className="cookie-banner-title">Cookie Preferences</span>
          </div>

          <button
            type="button"
            className="cookie-banner-close"
            onClick={() => dismissWithConsent('essential')}
            aria-label="Dismiss cookie banner"
            title="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="cookie-banner-text">
          We use essential cookies to keep your filing session secure, and anonymous telemetry to improve our tax tools. We never sell or share your financial data.{' '}
          <Link to="/privacy-policy" className="cookie-banner-link">
            Privacy Policy
          </Link>
        </p>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-banner-btn-accept"
            onClick={() => dismissWithConsent('all')}
          >
            Accept All
          </button>
          <button
            type="button"
            className="cookie-banner-btn-decline"
            onClick={() => dismissWithConsent('essential')}
          >
            Essential Only
          </button>
        </div>
      </div>
    </aside>
  )
}
