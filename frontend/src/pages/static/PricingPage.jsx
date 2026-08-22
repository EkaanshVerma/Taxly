import React from 'react'
import { Link } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'
import './PricingPage.css'

export default function PricingPage() {
  return (
    <StaticPageLayout title="Transparent Pricing. No hidden fees.">
      <p className="pricing-subtitle">
        Whether your taxes are simple or you need deep CA verification, we have a flat fee tier that covers you.
      </p>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3>Standard</h3>
          <div className="price">₹199<span>/ filing</span></div>
          <p className="desc">For simple salaried individuals with standard deductions.</p>
          <ul className="features">
            <li><span className="check">✓</span> <strong>Bank statement AI review</strong>: Parses and categorizes</li>
            <li><span className="check">✓</span> ITR-1 filing</li>
            <li><span className="check">✓</span> Form 16 auto-sync</li>
            <li><span className="cross">×</span> No manual CA verification</li>
          </ul>
          <Link to="/" className="btn-cta">Get Started</Link>
        </div>

        <div className="pricing-card recommended">
          <div className="badge-popular">Most Popular</div>
          <h3>Premium</h3>
          <div className="price">₹999<span>/ filing</span></div>
          <p className="desc">For multiple income sources, freelancers, and peace of mind.</p>
          <ul className="features">
            <li><span className="check">✓</span> <strong>Bank statement AI review</strong>: Deep flag &amp; suggest</li>
            <li><span className="check">✓</span> ITR-1, ITR-2, ITR-4</li>
            <li><span className="check">✓</span> <strong>CA Verification Depth</strong>: Standard review of AI flags</li>
            <li><span className="check">✓</span> 7-day money-back guarantee</li>
          </ul>
          <Link to="/" className="btn-cta">Get Started</Link>
        </div>

        <div className="pricing-card">
          <h3>Pro / NRI</h3>
          <div className="price">₹1,999<span>/ filing</span></div>
          <p className="desc">For complex capital gains, foreign assets, and NRI filings.</p>
          <ul className="features">
            <li><span className="check">✓</span> <strong>Bank statement AI review</strong>: Comprehensive</li>
            <li><span className="check">✓</span> DTAA, RNOR, Foreign Assets</li>
            <li><span className="check">✓</span> <strong>CA Verification Depth</strong>: Deep manual audit</li>
            <li><span className="check">✓</span> Priority CA phone support</li>
          </ul>
          <Link to="/" className="btn-cta">Get Started</Link>
        </div>
      </div>

      <div className="tier-quiz-banner">
        <h3>Not sure which tier you need?</h3>
        <p>Take our 2-minute quiz and let our AI recommend the right tier based on your income complexity.</p>
        <Link to="/pricing/which-tier" className="btn-secondary">Find my tier</Link>
      </div>
    </StaticPageLayout>
  )
}
