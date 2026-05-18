import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, createClient, approveClient, downloadXml, deleteClient } from '../api/ca'

export default function CADashboardPage({ caToken, setCAToken }) {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  
  const [newClient, setNewClient] = useState({ name: '', phone: '' })
  const [approveNotes, setApproveNotes] = useState('')

  useEffect(() => {
    if (!caToken) {
      navigate('/ca/login')
      return
    }
    fetchClients()
  }, [caToken, navigate])

  const fetchClients = async () => {
    try {
      const res = await getClients(caToken)
      console.log('GET /ca/clients response:', res.data)
      const data = Array.isArray(res.data) ? res.data : (res.data.clients || res.data.data || [])
      setClients(data)
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setCAToken(null)
    navigate('/ca/login')
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    try {
      await createClient(caToken, newClient.name, newClient.phone)
      setShowAddModal(false)
      setNewClient({ name: '', phone: '' })
      fetchClients()
    } catch (err) {
      alert('Failed to add client')
    }
  }

  const handleApprove = async () => {
    try {
      await approveClient(caToken, selectedClient.session_id, approveNotes)
      setShowApproveModal(false)
      fetchClients()
    } catch (err) {
      alert('Failed to approve')
    }
  }

  const handleDownloadXml = async (sessionId) => {
    try {
      const res = await downloadXml(caToken, sessionId)
      const blob = new Blob([res.data.xml], { type: 'text/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'taxly_itr_2025-26.xml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download XML. Ensure session is complete and approved.')
    }
  }

  const openApproveModal = (client) => {
    setSelectedClient(client)
    setApproveNotes('')
    setShowApproveModal(true)
  }

  const handleDeleteClient = async (sessionId, clientName) => {
    if (window.confirm(`Delete ${clientName}? This cannot be undone.`)) {
      try {
        await deleteClient(caToken, sessionId)
        setClients(clients.filter(c => c.session_id !== sessionId))
      } catch (err) {
        alert('Failed to delete client. Please try again.')
      }
    }
  }

  if (loading) return <div className="view active" id="summary"><div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh'}}><div className="typing-bubble"><div className="typing-dots"><span/><span/><span/></div></div></div></div>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Navbar */}
      <div style={{ width: '100%', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '24px', color: '#1e3a5f', letterSpacing: '-0.5px' }}>Taxly</div>
          <div style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 8px', background: '#f1f5f9', borderRadius: '6px' }}>CA Portal</div>
        </div>
        <div>
          <button style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => {e.target.style.background = '#f8fafc'; e.target.style.color = '#0f172a'}} onMouseOut={e => {e.target.style.background = 'transparent'; e.target.style.color = '#475569'}} onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px 40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0' }}>Client Dashboard</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Manage your clients and review tax filings.</p>
          </div>
          <button style={{ background: '#1e3a5f', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={e => e.target.style.background = '#152943'} onMouseOut={e => e.target.style.background = '#1e3a5f'} onClick={() => setShowAddModal(true)}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Add New Client
          </button>
        </div>
        
        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client Details</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>No clients found. Click "+ Add New Client" to get started.</td></tr>
              ) : clients.map(c => {
                const isApproved = c.ca_approved;
                const isComplete = c.status === 'complete';
                
                let statusText = 'In Progress';
                let statusBg = '#fef3c7';
                let statusColor = '#d97706';
                
                if (isApproved) {
                  statusText = 'Approved';
                  statusBg = '#dcfce7';
                  statusColor = '#16a34a';
                } else if (isComplete) {
                  statusText = 'Complete';
                  statusBg = '#e0f2fe';
                  statusColor = '#0284c7';
                }
                
                return (
                  <tr key={c.session_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{c.client_name}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{c.client_phone || 'No phone provided'}</div>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#475569', fontSize: '13px' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: statusBg, color: statusColor, display: 'inline-block' }}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button style={{ background: '#ffffff', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => {e.target.style.background = '#fef2f2'; e.target.style.borderColor = '#dc2626'}} onMouseOut={e => {e.target.style.background = '#ffffff'; e.target.style.borderColor = '#ef4444'}} onClick={() => handleDeleteClient(c.session_id, c.client_name)}>Delete</button>
                        <button style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => {e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#94a3b8'}} onMouseOut={e => {e.target.style.background = '#ffffff'; e.target.style.borderColor = '#cbd5e1'}} onClick={() => navigate(`/chat/${c.session_id}`)}>Open Chat</button>
                        
                        {isComplete && !isApproved && (
                          <button style={{ background: '#1e3a5f', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#ffffff', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#152943'} onMouseOut={e => e.target.style.background = '#1e3a5f'} onClick={() => openApproveModal(c)}>Review & Approve</button>
                        )}
                        
                        {isComplete && isApproved && (
                          <button style={{ background: '#16a34a', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: '#ffffff', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#15803d'} onMouseOut={e => e.target.style.background = '#16a34a'} onClick={() => handleDownloadXml(c.session_id)}>Download XML</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '440px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Add New Client</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Create a new tax filing session</p>
            </div>
            <form onSubmit={handleAddClient} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Client Name</label>
                <input required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#475569', marginBottom: '8px' }}>Phone Number (Optional)</label>
                <input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} placeholder="e.g. +91 98765 43210" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#1e3a5f', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#ffffff', cursor: 'pointer' }}>Create Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '560px', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>Review: {selectedClient.client_name}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Approve data to generate ITR XML</p>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Income & Deductions</h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedClient.income_data ? Object.entries(selectedClient.income_data).map(([k, v], i) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? '#ffffff' : '#f8fafc', fontSize: '14px' }}>
                      <span style={{ color: '#64748b' }}>{k}</span>
                      <span style={{ fontWeight: 500, color: '#0f172a' }}>{v !== null ? v.toString() : 'null'}</span>
                    </div>
                  )) : <div style={{ padding: '16px', color: '#64748b' }}>No income data available</div>}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>CA Approval Notes</h4>
                <textarea placeholder="Add any internal notes (optional)" value={approveNotes} onChange={e => setApproveNotes(e.target.value)} style={{ width: '100%', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', color: '#0f172a', outline: 'none', resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#1e3a5f'} onBlur={e => e.target.style.borderColor = '#cbd5e1'} />
              </div>
            </div>
            
            <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button style={{ padding: '10px 20px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#475569', cursor: 'pointer' }} onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button style={{ padding: '10px 20px', background: '#1e3a5f', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#ffffff', cursor: 'pointer' }} onClick={handleApprove}>Approve & Generate XML</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
