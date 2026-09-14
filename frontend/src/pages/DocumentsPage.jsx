import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getSessions, downloadXml } from '../api/taxly'
import { useToast } from '../components/ToastContext'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = JSON.parse(localStorage.getItem('taxly_user') || '{}')
  const userId = user.email || localStorage.getItem('taxly_user_email') || 'demo@taxly.in'
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('taxly_token')) { navigate('/login'); return }
    getSessions(userId)
      .then(res => setSessions((res.data || []).filter(s => s.status === 'complete')))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [userId, navigate])

  async function handleDownload(s) {
    try {
      const res = await downloadXml(s.session_id)
      const blob = new Blob([res.data], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Taxly_ITR_${s.session_id}.xml`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('XML downloaded!')
    } catch {
      toast.error('Download failed. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 20px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Tax Documents</h1>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28 }}>
          Download your ITR XML files for past filings.
        </p>

        {loading ? (
          <div style={{ background: '#e2e8f0', borderRadius: 16, height: 180, animation: 'shimmer 1.4s ease infinite' }} />
        ) : sessions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '56px 32px', textAlign: 'center', border: '2px dashed #e2e8f0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📂</div>
            <h2 style={{ fontSize: 20, color: '#0f172a', fontWeight: 800, marginBottom: 8 }}>No documents yet</h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
              Complete an ITR filing to get your XML document here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ background: 'linear-gradient(135deg,#0D7A5F,#0b6a50)', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map(s => (
              <div key={s.session_id} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  📄
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>ITR XML — AY 2025–26</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                    Session {s.session_id.slice(0, 12)}… · Filed {new Date(s.updated_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(s)}
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: 'none', padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  ⬇ Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  )
}
