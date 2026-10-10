import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import FaqAccordion from '../components/FaqAccordion'
import './Home.css'

const faqItems = [
  {
    q: "If Taxly gets my calculation wrong, who's responsible?",
    a: "The tax math runs through a deterministic Python engine — tested against dozens of scenarios, no AI involved in the arithmetic. If our engine makes an error that leads to a defect notice, we cover the cost of filing a revised return and any interest directly caused by our mistake. On the CA-verified tier, a chartered accountant also checks every flagged item before your return is unlocked."
  },
  {
    q: "Is my data safe?",
    a: "Your PAN, salary details, and documents are used only to generate your ITR XML. We don't sell or share your data with third parties. Bank statement analysis happens to flag items for your CA to review — it's never used for anything beyond your own filing."
  },
  {
    q: "What if I have two Form 16s from switching jobs?",
    a: "Upload both. Taxly merges them automatically and aggregates your TDS across both employers — this is one of the most common places manual filing goes wrong."
  },
  {
    q: "Do you actually submit my return to the income tax department?",
    a: "Not yet. Taxly generates your ITR XML, ready to upload. You, or your CA on the verified tier, submit and e-verify it on the official portal. We're not a registered e-Return Intermediary at this stage."
  },
  {
    q: "What's the difference between the pricing tiers?",
    a: "Self-file is fully automated — no human involved, and we don't pretend otherwise. AI + CA verified adds bank statement analysis and a chartered accountant checking every flagged deduction against real evidence. Full advisory adds direct CA consultation for business income, property sales, or multi-year planning."
  },
  {
    q: "Does Taxly handle crypto, NRI returns, or capital gains?",
    a: "Yes — crypto at the flat rate under Section 115BBH, NRI returns with DTAA relief for six treaty countries, and capital gains on equity, debt funds, and property, including Section 54 reinvestment and the January 2018 grandfathering rule for equity LTCG."
  }
]

export default function Faq() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('theme')
      if (p === 'light' || p === 'dark') return p
      const saved = localStorage.getItem('taxly_theme')
      if (saved) return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  })

  // Reduced motion detection
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    document.body.style.backgroundColor = 'var(--bg)'
    document.body.style.color = 'var(--text)'
  }, [theme])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('taxly_theme', nextTheme)
  }, [theme])

  // Reveal on scroll
  useEffect(() => {
    const revealEls = document.querySelectorAll('.home-page .rv')
    if ('IntersectionObserver' in window && !reduceMotion) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('seen')
            obs.unobserve(e.target)
          }
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
      revealEls.forEach((el) => obs.observe(el))
      return () => obs.disconnect()
    } else {
      revealEls.forEach((el) => el.classList.add('seen'))
    }
  }, [reduceMotion])

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      <SiteNav theme={theme} toggleTheme={toggleTheme} />

      <header className="hero" style={{ paddingBottom: 32 }}>
        <div className="wrap hero-in">
          <div className="eyebrow">FAQ</div>
          <h1>Questions people <em>actually ask.</em></h1>
          <p className="hero-sub">
            Pulled from real conversations with people deciding whether to trust 
            an automated tool with their taxes.
          </p>
        </div>
      </header>

      <section style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 48 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <FaqAccordion items={faqItems} />
        </div>
      </section>

      <div className="cta">
        <div className="wrap cta-in">
          <h2>Still have a question?</h2>
          <p>WE ANSWER THESE OURSELVES — NOT A BOT</p>
          <Link to="/for-cas#request-access" className="btn btn-line btn-lg" style={{ marginRight: 10 }}>
            For CAs →
          </Link>
          <Link to="/login" className="btn btn-fill btn-lg">Start filing free →</Link>
        </div>
      </div>

      <SiteFooter theme={theme} />
    </div>
  )
}
