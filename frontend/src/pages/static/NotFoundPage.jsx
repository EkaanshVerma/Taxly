import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StaticPageLayout from '../../components/StaticPageLayout'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <StaticPageLayout title="">
      <div style={s.wrap}>
        <div style={s.code}>404</div>
        <h1 style={s.title}>This page doesn't exist</h1>
        <p style={s.desc}>
          The page you're looking for has moved, been removed, or the URL might be wrong.
        </p>

        <div style={s.actions}>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← Go back</button>
          <Link to="/" style={s.homeBtn}>Go to homepage</Link>
        </div>

        <div style={s.quickLinks}>
          <p style={s.quickTitle}>Or jump to:</p>
          <div style={s.links}>
            {[
              ['File my taxes', '/'],
              ['Pricing', '/pricing'],
              ['How it works', '/features/bank-statement-review'],
              ['For CAs', '/for-cas'],
              ['Dashboard', '/dashboard'],
            ].map(([label, href]) => (
              <Link key={href} to={href} style={s.chip}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </StaticPageLayout>
  )
}

const s = {
  wrap: { textAlign: 'center', padding: '48px 0 80px' },
  code: { fontSize: 96, fontWeight: 900, color: '#E5E2D9', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 800, color: '#0D1117', marginBottom: 12 },
  desc: { fontSize: 16, color: '#4A4F5C', lineHeight: 1.7, maxWidth: 400, margin: '0 auto 32px' },
  actions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 },
  backBtn: { background: '#F7F6F2', border: '1.5px solid #E5E2D9', color: '#0D1117', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' },
  homeBtn: { background: '#0D1117', color: '#fff', borderRadius: 12, padding: '12px 24px', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'inline-block' },
  quickLinks: { borderTop: '1px solid #EFEDE7', paddingTop: 36 },
  quickTitle: { fontSize: 14, color: '#8A8FA3', marginBottom: 16 },
  links: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  chip: { background: '#F7F6F2', border: '1px solid #E5E2D9', color: '#0D1117', borderRadius: 999, padding: '8px 18px', fontSize: 14, fontWeight: 500, textDecoration: 'none' },
}
