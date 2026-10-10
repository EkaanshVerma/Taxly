import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function SiteNav({ theme, toggleTheme, startFiling, loading = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isStuck, setIsStuck] = React.useState(false)
  const boundaryRef = React.useRef(null)

  React.useEffect(() => {
    const boundary = boundaryRef.current
    if (!boundary) return

    const checkStuck = () => {
      const rect = boundary.getBoundingClientRect()
      const stuck = rect.top <= -10 || window.scrollY > 20
      setIsStuck(stuck)
      if (stuck) {
        document.documentElement.setAttribute('data-header-stuck', 'true')
      } else {
        document.documentElement.removeAttribute('data-header-stuck')
      }
    }

    window.addEventListener('scroll', checkStuck, { passive: true })
    window.addEventListener('resize', checkStuck, { passive: true })
    checkStuck()

    return () => {
      window.removeEventListener('scroll', checkStuck)
      window.removeEventListener('resize', checkStuck)
      document.documentElement.removeAttribute('data-header-stuck')
    }
  }, [location.pathname])

  function handleAnchorNav(e, hash) {
    if (location.pathname === '/') {
      e.preventDefault()
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
    }
    // if not on homepage, let the default navigation to "/" + hash happen
  }

  const handleStart = startFiling || (() => navigate('/login'))

  return (
    <>
      <div
        aria-hidden="true"
        className="site-header-sticky-boundary"
        data-site-header-sticky-boundary="true"
        ref={boundaryRef}
      />
      <nav
        className={`site-header-root ${isStuck ? 'is-stuck' : ''}`}
        data-header-stuck={isStuck ? 'true' : 'false'}
        data-site-header="true"
      >
        <div className="site-header-surface">
          <div className="nav-in">
            <Link to="/" className="brand site-header-logo" aria-label="Taxly Home">
              <img
                src={theme === 'light' ? '/logo-color.png' : '/logo-white.png'}
                alt="Taxly Logo"
                className="brand-logo-img"
                onError={(e) => { e.target.src = '/logo.png' }}
              />
            </Link>
            <ul className="nav-links">
              <li><a href="/#how" onClick={(e) => handleAnchorNav(e, '#how')}>How it works</a></li>
              <li><a href="/#analyze" onClick={(e) => handleAnchorNav(e, '#analyze')}>Statement AI</a></li>
              <li><Link to="/for-cas" className={location.pathname === '/for-cas' ? 'active' : ''}>For CAs</Link></li>
              <li><Link to="/pricing" className={location.pathname === '/pricing' ? 'active' : ''}>Pricing</Link></li>
              <li><Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>About</Link></li>
              <li><Link to="/faq" className={location.pathname === '/faq' ? 'active' : ''}>FAQ</Link></li>
            </ul>
            <div className="nav-right">
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-pressed={theme === 'dark'}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
                  </svg>
                )}
              </button>
              <Link to="/login" className="btn btn-ghost">Log In</Link>
              <button onClick={handleStart} className="btn btn-fill" disabled={loading}>
                <span className="nav-btn-text-full">{loading ? 'Starting...' : 'Start a free trial →'}</span>
                <span className="nav-btn-text-short">{loading ? 'Starting...' : 'Start free →'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

