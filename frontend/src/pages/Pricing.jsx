import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import {
  CATEGORIES,
  INDIVIDUAL_PLANS,
  CA_PLANS,
  INDIVIDUAL_FEATURES,
  CA_FEATURES,
  ADD_ONS,
  PRICING_FAQ
} from '../data/pricing.js'
import './Pricing.css'
import './Home.css'

// Helper to format currency or placeholder
function formatPrice(amount) {
  if (amount === null || amount === undefined) {
    return '₹ —'
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper to render tagline with **bold** text
function renderTagline(tagline) {
  const parts = tagline.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export default function Pricing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialAudience = searchParams.get('audience') === 'cas' ? 'cas' : 'individuals'
  const [audience, setAudience] = useState(initialAudience)

  // Mobile check for default collapse state (<768px collapsed, desktop expanded)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768
    return true
  })

  // Group collapse state: Record<categoryId, boolean>
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {}
    const defaultState = typeof window !== 'undefined' ? window.innerWidth >= 768 : true
    CATEGORIES.forEach(cat => {
      initial[cat.id] = defaultState
    })
    return initial
  })

  // Mobile comparison plan switcher (defaults to featured plan)
  const [mobileSelectedPlanId, setMobileSelectedPlanId] = useState('plus')

  // FAQ accordion active item
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Theme management
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

  // Track window resize for desktop vs mobile breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sync URL search params when audience changes
  const handleAudienceChange = (newAudience) => {
    setAudience(newAudience)
    const newParams = new URLSearchParams(searchParams)
    if (newAudience === 'cas') {
      newParams.set('audience', 'cas')
      setMobileSelectedPlanId('growth-firm')
    } else {
      newParams.set('audience', 'individuals')
      setMobileSelectedPlanId('plus')
    }
    setSearchParams(newParams, { replace: true })
  }

  // Theme application
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
    document.body.style.backgroundColor = 'var(--bg)'
    document.body.style.color = 'var(--text)'
  }, [theme])

  // Reduced motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (e) => setReduceMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('taxly_theme', nextTheme)
  }, [theme])

  // Current plans and features based on audience
  const plans = audience === 'cas' ? CA_PLANS : INDIVIDUAL_PLANS
  const features = audience === 'cas' ? CA_FEATURES : INDIVIDUAL_FEATURES

  // Determine if all groups are expanded
  const allExpanded = useMemo(() => {
    return CATEGORIES.every(cat => expandedGroups[cat.id] === true)
  }, [expandedGroups])

  // Toggle all groups
  const toggleAllGroups = () => {
    const targetState = !allExpanded
    const updated = {}
    CATEGORIES.forEach(cat => {
      updated[cat.id] = targetState
    })
    setExpandedGroups(updated)
  }

  // Toggle single group
  const toggleGroup = (catId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  // Compute cumulative features per plan and category
  // Higher plans inherit lower plan features, and highlight new features introduced at that tier
  const planFeaturesByCat = useMemo(() => {
    const result = {}

    plans.forEach((plan, planIdx) => {
      result[plan.id] = {}
      const prevPlan = planIdx > 0 ? plans[planIdx - 1] : null

      CATEGORIES.forEach(cat => {
        const catFeatures = features.filter(f => f.categoryId === cat.id)
        const activeItems = []

        catFeatures.forEach(feat => {
          const val = feat.values[plan.id]
          // Active if true, on-demand, available, or a specific string/number
          if (val !== false && val !== undefined) {
            const prevVal = prevPlan ? feat.values[prevPlan.id] : false
            const isInherited = prevVal !== false && prevVal !== undefined && prevVal === val
            activeItems.push({
              feature: feat,
              value: val,
              isInherited,
              isNew: !isInherited
            })
          }
        })

        result[plan.id][cat.id] = activeItems
      })
    })

    return result
  }, [plans, features])

  // Update SEO Title & Meta tags
  useEffect(() => {
    document.title = 'Pricing | Taxly'
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Transparent, flat pricing for self-filing, Chartered Accountant verification, and CA firm practices. No hidden fees.'
      )
    }

    // Add FAQPage JSON-LD
    const jsonLdId = 'taxly-pricing-faq-jsonld'
    let scriptTag = document.getElementById(jsonLdId)
    if (!scriptTag) {
      scriptTag = document.createElement('script')
      scriptTag.id = jsonLdId
      scriptTag.type = 'application/ld+json'
      document.head.appendChild(scriptTag)
    }
    const faqData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': PRICING_FAQ.map(item => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.a
        }
      }))
    }
    scriptTag.textContent = JSON.stringify(faqData)

    return () => {
      const existing = document.getElementById(jsonLdId)
      if (existing) existing.remove()
    }
  }, [])

  return (
    <div className={`pricing-page home-page theme-${theme}`} data-theme={theme}>
      <SiteNav theme={theme} toggleTheme={toggleTheme} />

      <main>
        {/* ─── 1. Page Header & Audience Controls ───────────────────────────── */}
        <section className="pricing-header pricing-wrap">
          <h1 className="pricing-title">Taxly Pricing</h1>
          <p className="pricing-subtitle">
            Straightforward, flat pricing for individuals and chartered accountancy practices.
            Zero hidden charges.
          </p>

          <div className="pricing-controls">
            <div className="audience-segmented-toggle" role="tablist" aria-label="Audience Type">
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'individuals'}
                onClick={() => handleAudienceChange('individuals')}
                className={`audience-toggle-btn ${audience === 'individuals' ? 'active' : ''}`}
              >
                Individuals
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={audience === 'cas'}
                onClick={() => handleAudienceChange('cas')}
                className={`audience-toggle-btn ${audience === 'cas' ? 'active' : ''}`}
              >
                CAs &amp; Firms
                <span className="audience-badge">Practice</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleAllGroups}
              className="collapse-all-btn"
              aria-label={allExpanded ? 'Collapse all feature groups' : 'Expand all feature groups'}
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        </section>

        {/* ─── 2. Plan Cards Grid ───────────────────────────────────────────── */}
        <section className="pricing-wrap" aria-label="Pricing Plans">
          <div className="plans-grid">
            {plans.map((plan) => {
              const isEnterprise = plan.price.amount === null && !plan.price.unit
              const isHighlighted = !!plan.highlighted

              return (
                <article
                  key={plan.id}
                  className={`plan-card ${isHighlighted ? 'highlighted' : ''}`}
                >
                  {plan.badge && (
                    <div className="plan-popular-badge">{plan.badge}</div>
                  )}

                  {/* Sticky Tier Name Header */}
                  <div className="plan-card-tier-sticky">
                    <h2 className="plan-name">{plan.name}</h2>
                  </div>

                  <div className="plan-card-meta">
                    <p className="plan-tagline">{renderTagline(plan.tagline)}</p>

                    <div className="plan-price-block">
                      {isEnterprise ? (
                        <div>
                          <div className="plan-enterprise-label">Custom Enterprise</div>
                          <div className="plan-price-note">{plan.price.note}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="plan-price-main">
                            <span className="plan-price-amount">
                              {formatPrice(plan.price.amount)}
                            </span>
                            <span className="plan-price-unit">{plan.price.unit}</span>
                          </div>
                          {plan.price.note && (
                            <div className="plan-price-note">{plan.price.note}</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Top CTA */}
                    <Link
                      to={plan.cta.href}
                      className={`plan-cta-btn ${isHighlighted ? 'primary' : 'secondary'}`}
                    >
                      {plan.cta.label}
                    </Link>
                  </div>

                  {/* Feature Groups (Cumulative ladder) */}
                  <div className="plan-feature-groups">
                    {CATEGORIES.map((cat) => {
                      const isExpanded = !!expandedGroups[cat.id]
                      const catItems = planFeaturesByCat[plan.id]?.[cat.id] || []
                      const hasItems = catItems.length > 0

                      return (
                        <div key={cat.id} className="plan-feature-group">
                          <button
                            type="button"
                            onClick={() => toggleGroup(cat.id)}
                            className="plan-group-toggle"
                            aria-expanded={isExpanded}
                            aria-controls={`panel-${plan.id}-${cat.id}`}
                          >
                            <span>{cat.name}</span>
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`plan-group-chevron ${isExpanded ? 'expanded' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          <div
                            id={`panel-${plan.id}-${cat.id}`}
                            className={`plan-group-items ${!isExpanded ? 'collapsed' : ''}`}
                            style={{
                              maxHeight: isExpanded ? `${catItems.length * 40 + 20}px` : '0px'
                            }}
                          >
                            {hasItems ? (
                              catItems.map(({ feature, value, isInherited, isNew }) => (
                                <div
                                  key={feature.id}
                                  className={`plan-feature-item ${isInherited ? 'inherited' : 'new-at-tier'}`}
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="plan-check-icon"
                                    aria-hidden="true"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>
                                    {feature.name}
                                    {typeof value === 'string' && value !== 'available' && value !== 'on-demand' && (
                                      <span style={{ opacity: 0.85, fontWeight: 500 }}>: {value}</span>
                                    )}
                                    {typeof value === 'number' && (
                                      <span style={{ opacity: 0.85, fontWeight: 500 }}>: {value} docs</span>
                                    )}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="plan-group-empty">—</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Repeated Bottom CTA */}
                  <Link
                    to={plan.cta.href}
                    className={`plan-cta-btn plan-cta-bottom ${isHighlighted ? 'primary' : 'secondary'}`}
                  >
                    {plan.cta.label}
                  </Link>
                </article>
              )
            })}
          </div>

          <p className="pricing-footnote">
            All prices in INR · 18% GST applicable at checkout · Formal tax invoice provided with your business GSTIN
          </p>
        </section>

        {/* ─── 3. On-Demand Products (Add-ons) ─────────────────────────────── */}
        <section className="addons-section pricing-wrap" aria-labelledby="addons-heading">
          <h2 id="addons-heading" className="addons-heading">On-Demand Products</h2>
          <div className="addons-grid">
            {ADD_ONS.map((addon) => (
              <article key={addon.id} className="addon-card">
                <div>
                  <h3 className="addon-title">{addon.title}</h3>
                  <p className="addon-desc">{addon.description}</p>
                  <ul className="addon-bullets">
                    {addon.bullets.map((bullet, idx) => (
                      <li key={idx} className="addon-bullet-item">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="plan-check-icon"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to={addon.cta.href} className="addon-cta-btn">
                  {addon.cta.label}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* ─── 4. Detailed Plan Comparison Table ───────────────────────────── */}
        <section className="comparison-section pricing-wrap" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="comparison-heading">
            Detailed Plan Comparison
          </h2>

          {/* Mobile Plan Switcher (<768px) */}
          <div className="comparison-mobile-tabs" role="tablist" aria-label="Select Plan to Compare">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={mobileSelectedPlanId === p.id}
                onClick={() => setMobileSelectedPlanId(p.id)}
                className={`comparison-mobile-tab-btn ${mobileSelectedPlanId === p.id ? 'active' : ''}`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <caption className="sr-only">
                Detailed feature comparison across Taxly plans
              </caption>

              <tbody>
                {CATEGORIES.map((cat) => {
                  const catFeatures = features.filter(f => f.categoryId === cat.id)

                  return (
                    <React.Fragment key={cat.id}>
                      {/* Sticky Category Header Row with Tier Names */}
                      <tr className="comparison-category-row">
                        <th scope="row" className="comparison-category-th-feature">
                          <div className="comparison-category-header-wrap">
                            <h3 className="comparison-category-title">
                              <span className="comparison-category-brand">Taxly </span>
                              <span className="comparison-category-name">{cat.name}</span>
                            </h3>
                            <p className="comparison-category-desc">{cat.description}</p>
                          </div>
                        </th>

                        {plans.map((p) => {
                          const isHiddenOnMobile = !isDesktop && p.id !== mobileSelectedPlanId
                          if (isHiddenOnMobile) return null

                          return (
                            <th
                              key={p.id}
                              scope="col"
                              className={`comparison-category-th-plan ${p.highlighted ? 'highlighted' : ''}`}
                            >
                              <span className="comparison-category-plan-name">{p.name}</span>
                            </th>
                          )
                        })}
                      </tr>

                      {/* Feature Rows */}
                      {catFeatures.map((feat) => (
                        <tr key={feat.id} className="comparison-feature-row">
                          <th scope="row" className="comparison-feature-cell">
                            <span className="comparison-feature-name">{feat.name}</span>
                            <span className="comparison-feature-desc">{feat.description}</span>
                          </th>

                          {plans.map((p) => {
                            const isHiddenOnMobile = !isDesktop && p.id !== mobileSelectedPlanId
                            if (isHiddenOnMobile) return null

                            const val = feat.values[p.id]

                            return (
                              <td
                                key={p.id}
                                className={`comparison-value-cell ${p.highlighted ? 'highlighted' : ''}`}
                              >
                                {val === true && (
                                  <>
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="val-check-icon"
                                      aria-hidden="true"
                                    >
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    <span className="sr-only">Included</span>
                                  </>
                                )}

                                {val === false && (
                                  <>
                                    <span className="val-dash" aria-hidden="true">—</span>
                                    <span className="sr-only">Not included</span>
                                  </>
                                )}

                                {val === 'on-demand' && (
                                  <span className="val-chip">On-demand</span>
                                )}

                                {val === 'available' && (
                                  <span className="val-chip">Available</span>
                                )}

                                {(typeof val === 'string' || typeof val === 'number') &&
                                  val !== 'on-demand' &&
                                  val !== 'available' && (
                                    <span className="val-text">{val}</span>
                                  )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── 5. Frequently Asked Questions ────────────────────────────────── */}
        <section className="pricing-faq-section pricing-wrap" aria-labelledby="pricing-faq-title">
          <h2 id="pricing-faq-title" className="pricing-faq-heading">
            Frequently Asked Questions
          </h2>

          <div className="pricing-faq-list" role="region" aria-label="Pricing Questions">
            {PRICING_FAQ.map((faq, idx) => {
              const isOpen = openFaqIndex === idx

              return (
                <div key={idx} className="pricing-faq-item">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={`pricing-faq-ans-${idx}`}
                    className={`pricing-faq-button ${isOpen ? 'open' : ''}`}
                  >
                    <span>{faq.q}</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pricing-faq-chevron"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <div
                    id={`pricing-faq-ans-${idx}`}
                    className="pricing-faq-answer"
                    style={{
                      maxHeight: isOpen ? '240px' : '0px',
                      opacity: isOpen ? 1 : 0
                    }}
                  >
                    <p>{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pricing-faq-more">
            <Link to="/faq" className="pricing-faq-more-link">
              View all questions →
            </Link>
          </div>
        </section>

        {/* ─── 6. Final CTA Band ────────────────────────────────────────────── */}
        <div className="cta">
          <div className="wrap cta-in">
            <h2>Ready to get your taxes sorted?</h2>
            <p>CONVERSATIONAL ITR FILING WITH CHARTERED ACCOUNTANT SIGN-OFF</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/for-cas#request-access" className="btn btn-line btn-lg">
                For CAs →
              </Link>
              <Link to="/login" className="btn btn-fill btn-lg">
                Start filing free →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter theme={theme} />
    </div>
  )
}
