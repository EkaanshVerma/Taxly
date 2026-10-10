import React, { useState } from 'react'

export default function FaqAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (idx) => {
    setOpenIndex(prev => (prev === idx ? null : idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx
        return (
          <div
            key={idx}
            style={{
              border: '1px solid var(--line-soft)',
              background: 'var(--surface)',
              borderRadius: '11px',
              overflow: 'hidden',
              transition: 'border-color 0.25s ease, background 0.25s ease'
            }}
          >
            <button
              type="button"
              onClick={() => toggle(idx)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--txt)',
                fontSize: '14.5px',
                fontWeight: 600,
                fontFamily: 'inherit',
                lineHeight: 1.4
              }}
            >
              <span>{item.q}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: '18px',
                  height: '18px',
                  flexShrink: 0,
                  color: 'var(--txt-soft)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              style={{
                maxHeight: isOpen ? '360px' : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
                opacity: isOpen ? 1 : 0
              }}
            >
              <div
                style={{
                  padding: '0 16px 16px 16px',
                  fontSize: '13.5px',
                  color: 'var(--txt-soft)',
                  lineHeight: 1.6
                }}
              >
                {item.a}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
