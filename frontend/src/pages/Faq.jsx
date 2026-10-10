import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import FaqAccordion from '../components/FaqAccordion'
import './Home.css'

const allFaqItems = [
  {
    id: 'calc-guarantee',
    q: "If Taxly gets my calculation wrong, who's responsible?",
    a: "The tax math runs through a deterministic Python engine — tested against dozens of scenarios, no AI involved in the arithmetic. If our engine makes an error that leads to a defect notice, we cover the cost of filing a revised return and any interest directly caused by our mistake. On the CA-verified tier, a chartered accountant also checks every flagged item before your return is unlocked.",
    topics: ['popular', 'product', 'security']
  },
  {
    id: 'data-safety',
    q: "Is my data safe?",
    a: "Your PAN, salary details, and documents are used only to generate your ITR XML. We don't sell or share your data with third parties. Bank statement analysis happens to flag items for your CA to review — it's never used for anything beyond your own filing.",
    topics: ['popular', 'security']
  },
  {
    id: 'two-form16',
    q: "What if I have two Form 16s from switching jobs?",
    a: "Upload both. Taxly merges them automatically and aggregates your TDS across both employers — this is one of the most common places manual filing goes wrong.",
    topics: ['popular', 'product']
  },
  {
    id: 'itd-submission',
    q: "Do you actually submit my return to the income tax department?",
    a: "Not yet. Taxly generates your ITR XML, ready to upload. You, or your CA on the verified tier, submit and e-verify it on the official portal. We're not a registered e-Return Intermediary at this stage.",
    topics: ['product']
  },
  {
    id: 'pricing-tiers',
    q: "What's the difference between the pricing tiers?",
    a: "Self-file is fully automated — no human involved, and we don't pretend otherwise. AI + CA verified adds bank statement analysis and a chartered accountant checking every flagged deduction against real evidence. Full advisory adds direct CA consultation for business income, property sales, or multi-year planning.",
    topics: ['popular', 'pricing']
  },
  {
    id: 'crypto-nri',
    q: "Does Taxly handle crypto, NRI returns, or capital gains?",
    a: "Yes — crypto at the flat rate under Section 115BBH, NRI returns with DTAA relief for six treaty countries, and capital gains on equity, debt funds, and property, including Section 54 reinvestment and the January 2018 grandfathering rule for equity LTCG.",
    topics: ['product', 'gains']
  },
  {
    id: 'broker-import',
    q: "Can I import bank statements and broker summaries directly?",
    a: "Yes. You can upload PDF bank statements or broker P&L reports (Zerodha, Groww, Upstox, etc.). Taxly parses them locally, flags tax-deductible items like 80C or 80D, and computes grandfathered LTCG and STCG automatically.",
    topics: ['product', 'gains']
  },
  {
    id: 'hidden-fees',
    q: "Are there any hidden fees or recurring subscriptions?",
    a: "None. All pricing is flat per financial year filed. There are no recurring auto-debits, surprise export charges, or hidden platform fees.",
    topics: ['pricing']
  }
]

const topics = [
  { id: 'all', name: 'All topics' },
  { id: 'popular', name: 'Popular' },
  { id: 'product', name: 'Product' },
  { id: 'security', name: 'Security' },
  { id: 'pricing', name: 'Pricing' },
  { id: 'gains', name: 'Capital Gains & NRI' }
]

export default function Faq() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('popular')
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

  // Filter items by topic
  const filteredItems = useMemo(() => {
    if (selectedTopic === 'all') return allFaqItems
    return allFaqItems.filter(item => item.topics.includes(selectedTopic))
  }, [selectedTopic])

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      <SiteNav theme={theme} toggleTheme={toggleTheme} />

      <main className="faq-section">
        <div className="wrap">
          <div className="faq-layout">
            {/* Left sidebar: Title & topic selector */}
            <aside className="faq-sidebar">
              <h1 className="faq-hero-title">
                Frequently<br />
                asked<br />
                questions
              </h1>

              <div className="faq-topic-list" role="tablist" aria-label="FAQ Topics">
                {topics.map(topic => {
                  const isActive = selectedTopic === topic.id
                  const count = topic.id === 'all'
                    ? allFaqItems.length
                    : allFaqItems.filter(item => item.topics.includes(topic.id)).length

                  return (
                    <button
                      key={topic.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`faq-topic-btn ${isActive ? 'active' : ''}`}
                    >
                      <span>{topic.name}</span>
                      <span className="faq-topic-count">
                        {String(count).padStart(2, '0')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Right column: Card with FAQ accordion list */}
            <section className="faq-content">
              <FaqAccordion items={filteredItems} />
            </section>
          </div>
        </div>
      </main>

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
