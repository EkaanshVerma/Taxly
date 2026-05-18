import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSessions, getSession, createSession, downloadXml } from '../api/taxly'
import { v4 as uuidv4 } from 'uuid'

export default function UserDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const userId = localStorage.getItem('taxly_user_id')

  useEffect(() => {
    const token = localStorage.getItem('taxly_token')
    if (!token || !userId) {
      navigate('/login')
      return
    }
    fetchData()
  }, [userId, navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(false)
      const res = await getSessions(userId)
      const data = res.data || []
      setSessions(data)
      
      const paramSessionId = searchParams.get('session_id')
      if (paramSessionId) {
        const sessRes = await getSession(paramSessionId)
        setActiveSession(sessRes.data)
      } else if (data.length > 0) {
        const sessRes = await getSession(data[0].id)
        setActiveSession(sessRes.data)
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleStartFiling = async () => {
    try {
      setLoading(true)
      const res = await createSession(userId)
      navigate(`/chat/${res.data.session_id}`)
    } catch (err) {
      alert("Couldn't create session")
      setLoading(false)
    }
  }

  const handleDownloadXml = async (sessionId) => {
    try {
      const res = await downloadXml(sessionId)
      const blob = new Blob([res.data.xml], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `taxly_itr_${sessionId}.xml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download XML. Ensure payment is complete and session is ready.')
    }
  }

  const handlePay = (sessionId) => {
    // Mock payment trigger, typically would call the backend /pay endpoint
    alert("Payment portal opening... (Mock)")
  }

  const getProgressStep = (session) => {
    if (!session) return 0
    if (session.ca_approved) return 5
    if (session.status === 'complete') return 4
    const msgCount = (session.messages || []).length
    if (msgCount > 10) return 3
    if (msgCount > 6) return 2
    if (msgCount > 2) return 1
    return 0
  }

  if (loading && !activeSession && sessions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ color: '#64748b', fontSize: '16px', fontWeight: 500 }}>Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ padding: '20px', background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#dc2626', textAlign: 'center', fontWeight: 500 }}>
          Couldn't load your data. Please refresh.
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {/* Top Navbar */}
        <div style={{ width: '100%', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '24px', color: '#1e3a5f', letterSpacing: '-0.5px' }}>Taxly</div>
            <div style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px' }}>User Portal</div>
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '20px' }}>No Filings Yet</h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>You haven't started any tax filings. Click below to begin your chat-based ITR filing process.</p>
            <button onClick={handleStartFiling} style={{ background: '#1e3a5f', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', width: '100%' }}>Start your first filing</button>
          </div>
        </div>
      </div>
    )
  }

  const stepNames = ['Salary', 'Deductions', 'HRA', 'Capital Gains', 'CA Review']
  const currentStep = getProgressStep(activeSession)
  
  const incData = activeSession?.income_data || {}
  const hasCalculatedData = !!incData.gross_salary
  
  const renderStatusPill = (status, caApproved) => {
    let text = 'In Progress'
    let bg = '#fef3c7'
    let color = '#d97706'
    
    if (caApproved) {
      text = 'Approved'
      bg = '#dcfce7'
      color = '#16a34a'
    } else if (status === 'complete') {
      text = 'CA Review'
      bg = '#e0f2fe'
      color = '#0284c7'
    }
    
    return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: bg, color: color }}>{text}</span>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <div style={{ width: '100%', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '24px', color: '#1e3a5f', letterSpacing: '-0.5px' }}>Taxly</div>
          <div style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px' }}>User Portal</div>
        </div>
        <div>
          <button style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }} onClick={() => { localStorage.removeItem('taxly_token'); localStorage.removeItem('taxly_user_id'); navigate('/'); }}>Log Out</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', gap: '32px', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 8px 0' }}>Dashboard</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Track your tax filing progress and history.</p>
          </div>
          <button onClick={handleStartFiling} style={{ background: '#1e3a5f', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>+ New Filing</button>
        </div>

        {/* Active Session Overview */}
        {activeSession && (
          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px' }}>Active Filing (AY {activeSession.created_at ? new Date(activeSession.created_at).getFullYear() + 1 : '2025'}-{activeSession.created_at ? (new Date(activeSession.created_at).getFullYear() + 2).toString().slice(2) : '26'})</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {renderStatusPill(activeSession.status, activeSession.ca_approved)}
                  {activeSession.payment_status === 'paid' ? (
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>Payment Complete</span>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>Payment Pending</span>
                  )}
                </div>
              </div>
              <div>
                {activeSession.payment_status === 'paid' ? (
                  <button onClick={() => handleDownloadXml(activeSession.id)} disabled={!activeSession.ca_approved} style={{ background: activeSession.ca_approved ? '#16a34a' : '#94a3b8', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: activeSession.ca_approved ? 'pointer' : 'not-allowed' }}>Download XML</button>
                ) : (
                  <button onClick={() => handlePay(activeSession.id)} style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Pay ₹499</button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                {stepNames.map((name, i) => (
                  <div key={name} style={{ fontSize: '12px', fontWeight: 500, color: i < currentStep ? '#1e3a5f' : (i === currentStep ? '#0f172a' : '#cbd5e1') }}>{name}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {stepNames.map((_, i) => (
                  <div key={i} style={{ height: '6px', flex: 1, borderRadius: '3px', background: i < currentStep ? '#1e3a5f' : (i === currentStep ? '#93c5fd' : '#e2e8f0') }} />
                ))}
              </div>
            </div>

            {/* Tax Breakdown */}
            {!hasCalculatedData ? (
              <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Calculating... Continue chat to see your tax breakdown.</div>
                <button onClick={() => navigate(`/chat/${activeSession.id}`)} style={{ marginTop: '16px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#0f172a', cursor: 'pointer' }}>Resume Chat</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Income Summary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Gross Salary</span><span style={{ fontWeight: 500, color: '#0f172a' }}>₹{incData.gross_salary?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Standard Deduction</span><span style={{ fontWeight: 500, color: '#0f172a' }}>-₹{incData.standard_deduction?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>HRA Exemption</span><span style={{ fontWeight: 500, color: '#0f172a' }}>-₹{incData.hra_exemption?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>80C Deductions</span><span style={{ fontWeight: 500, color: '#0f172a' }}>-₹{incData.deduction_80c?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}><span style={{ color: '#0f172a', fontWeight: 600 }}>Net Taxable Income</span><span style={{ fontWeight: 600, color: '#0f172a' }}>₹{incData.net_taxable_income?.toLocaleString()}</span></div>
                  </div>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tax Calculation</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>Total Tax Payable</span><span style={{ fontWeight: 500, color: '#0f172a' }}>₹{incData.tax_payable?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#64748b' }}>TDS Paid</span><span style={{ fontWeight: 500, color: '#0f172a' }}>-₹{incData.tds_paid?.toLocaleString()}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{incData.refund_due < 0 ? 'Tax Owed' : 'Refund Due'}</span>
                      <span style={{ fontWeight: 600, color: incData.refund_due < 0 ? '#dc2626' : '#16a34a' }}>₹{Math.abs(incData.refund_due || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regime Comparison */}
            {incData.old_regime_tax !== undefined && incData.new_regime_tax !== undefined && (
              <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regime Comparison</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '20px', borderRadius: '8px', border: incData.recommended_regime === 'old' ? '2px solid #10b981' : '1px solid #e2e8f0', position: 'relative' }}>
                    {incData.recommended_regime === 'old' && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#10b981', color: '#ffffff', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>RECOMMENDED</div>}
                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Old Regime Tax</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>₹{incData.old_regime_tax.toLocaleString()}</div>
                  </div>
                  <div style={{ padding: '20px', borderRadius: '8px', border: incData.recommended_regime === 'new' ? '2px solid #10b981' : '1px solid #e2e8f0', position: 'relative' }}>
                    {incData.recommended_regime === 'new' && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#10b981', color: '#ffffff', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px' }}>RECOMMENDED</div>}
                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>New Regime Tax</div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>₹{incData.new_regime_tax.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History & Documents */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Filing History</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>AY</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: 500 }}>{s.created_at ? new Date(s.created_at).getFullYear() + 1 + '-' + (new Date(s.created_at).getFullYear() + 2).toString().slice(2) : '2025-26'}</td>
                    <td style={{ padding: '16px 24px', color: '#64748b' }}>{s.income_data?.itr_type || 'ITR-1'}</td>
                    <td style={{ padding: '16px 24px' }}>{renderStatusPill(s.status, s.ca_approved)}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button onClick={() => s.payment_status === 'paid' ? handleDownloadXml(s.id) : setActiveSession(s)} disabled={s.payment_status === 'paid' && !s.ca_approved} style={{ background: 'transparent', border: 'none', color: (s.payment_status === 'paid' && s.ca_approved) ? '#2563eb' : '#94a3b8', fontSize: '13px', fontWeight: 500, cursor: (s.payment_status === 'paid' && s.ca_approved) || s.payment_status !== 'paid' ? 'pointer' : 'not-allowed', textDecoration: 'underline' }}>
                        {s.payment_status === 'paid' ? 'Download XML' : 'View / Pay'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>Documents</h3>
            </div>
            <div style={{ padding: '20px 24px' }}>
              {sessions.map(s => {
                const files = s.income_data?.form16_files || []
                return files.map((file, idx) => (
                  <div key={`${s.id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#1e3a5f' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    <span>{file}</span>
                  </div>
                ))
              })}
              {sessions.filter(s => s.payment_status === 'paid' && s.ca_approved).map(s => (
                <div key={`xml-${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>ITR XML (AY {s.created_at ? new Date(s.created_at).getFullYear() + 1 : '2025'}-{s.created_at ? (new Date(s.created_at).getFullYear() + 2).toString().slice(2) : '26'})</span>
                </div>
              ))}
              {sessions.length === 0 || (!sessions.some(s => s.income_data?.form16_files) && !sessions.some(s => s.payment_status === 'paid')) ? (
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>No documents uploaded yet.</div>
              ) : null}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
