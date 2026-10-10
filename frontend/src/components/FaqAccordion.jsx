import React, { useState, useEffect } from 'react'

export default function FaqAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null)

  // Reset open item when the items array changes (e.g. topic filter switched)
  useEffect(() => {
    setOpenIndex(null)
  }, [items])

  const toggle = (idx) => {
    setOpenIndex(prev => (prev === idx ? null : idx))
  }

  return (
    <div className="faq-card">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div key={item.id || idx} className="faq-item">
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              className={`faq-item-btn ${isOpen ? 'open' : ''}`}
            >
              <span>{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="faq-icon-plus"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div
              className="faq-answer-panel"
              style={{
                maxHeight: isOpen ? '400px' : '0px',
                opacity: isOpen ? 1 : 0
              }}
            >
              <div className="faq-answer-content">
                {item.a}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
