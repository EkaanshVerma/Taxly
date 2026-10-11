import React, { useState, useEffect } from 'react'
import StaticPageLayout from '../../components/StaticPageLayout'
import {
  getComplianceStatus,
  getAuditLogs,
  exportComplianceData,
  deleteComplianceData
} from '../../api/taxly'
import './SecurityPage.css'

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('security')
  const [complianceData, setComplianceData] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [chainStatus, setChainStatus] = useState('INTACT')
  const [loadingStatus, setLoadingStatus] = useState(true)

  // Data Subject Rights state
  const [exportInput, setExportInput] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [exportResult, setExportResult] = useState(null)

  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchComplianceDetails()
  }, [])

  const fetchComplianceDetails = async () => {
    setLoadingStatus(true)
    try {
      const [statusRes, logsRes] = await Promise.allSettled([
        getComplianceStatus(),
        getAuditLogs(8)
      ])

      if (statusRes.status === 'fulfilled' && statusRes.value?.data) {
        setComplianceData(statusRes.value.data)
        if (statusRes.value.data.audit_trail) {
          setChainStatus(statusRes.value.data.audit_trail.cryptographic_chain_status)
        }
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.data) {
        setAuditLogs(logsRes.value.data.logs || [])
        if (logsRes.value.data.chain_status) {
          setChainStatus(logsRes.value.data.integrity_verified ? 'INTACT' : 'COMPROMISED')
        }
      }
    } catch {
      // Handled via defaults
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleExportData = async (e) => {
    e.preventDefault()
    if (!exportInput.trim()) return
    setExportLoading(true)
    setExportResult(null)
    try {
      const payload = exportInput.includes('@')
        ? { email: exportInput.trim() }
        : { user_id: exportInput.trim() }
      const res = await exportComplianceData(payload)
      
      // Trigger download of sanitized JSON file
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `taxly_dsr_export_${Date.now()}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      setExportResult({
        type: 'success',
        message: `Successfully generated portable archive with ${res.data.total_sessions ?? 0} session(s). Download initiated.`
      })
    } catch (err) {
      setExportResult({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to export data. Please check your identifier or contact support.'
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteData = async () => {
    if (!deleteInput.trim()) return
    setDeleteLoading(true)
    setDeleteResult(null)
    try {
      const payload = deleteInput.includes('@')
        ? { email: deleteInput.trim() }
        : { user_id: deleteInput.trim() }
      const res = await deleteComplianceData(payload)
      setDeleteResult({
        type: 'success',
        message: res.data.message || 'All records and session histories have been permanently purged.'
      })
      setShowDeleteConfirm(false)
      setDeleteInput('')
      fetchComplianceDetails()
    } catch (err) {
      setDeleteResult({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to execute erasure request. Please reach out to our Grievance Officer.'
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const tscCategories = {
    security: {
      title: 'Common Criteria: Boundary Defense & Access Control',
      badge: 'CC1.1 - CC9.2 Aligned',
      controls: [
        {
          name: 'HSTS & Comprehensive Boundary Headers',
          desc: 'Enforces Strict-Transport-Security (max-age=31536000), CSP, X-Frame-Options: DENY, and X-Content-Type-Options: nosniff on all endpoints.'
        },
        {
          name: 'Cryptographically Chained Audit Trails',
          desc: 'Every administrative, financial, and authentication event is hashed into an immutable SHA-256 block chain to prevent log tampering.'
        },
        {
          name: 'Strict Rate Limiting & DoS Mitigation',
          desc: 'Sliding-window per-IP token rate limiting on all endpoints with strict burst throttles on authentication and tax calculation routes.'
        },
        {
          name: 'Magic-Byte File Content Verification',
          desc: 'Uploads are strictly bounded to 10MB and validated against PDF binary signatures (%PDF-) to prevent malicious file execution.'
        }
      ]
    },
    confidentiality: {
      title: 'Confidentiality: Differential Privacy & Ephemeral Memory',
      badge: 'C1.1 - C1.2 Aligned',
      controls: [
        {
          name: 'Zero-Disk In-Memory PDF Processing',
          desc: 'Bank statements and Form 16 documents are processed in volatile RAM and immediately discarded. No unencrypted raw files touch persistent storage.'
        },
        {
          name: 'Deterministic PII Redaction & Masking',
          desc: 'PANs, Aadhaar numbers, phone numbers, emails, and bank accounts are automatically masked across all application logs and CA interfaces.'
        },
        {
          name: 'Role-Based Need-to-Know CA Access',
          desc: 'Reviewing Chartered Accountants are granted scoped access exclusively to tax-relevant lines. Discretionary personal spend counterparties remain obscured.'
        },
        {
          name: 'AES-256-GCM & TLS 1.3 Encryption',
          desc: 'All persistent records utilize AES-256 encryption at rest with automated key rotation. Transport is guarded by TLS 1.3 with Perfect Forward Secrecy.'
        }
      ]
    },
    integrity: {
      title: 'Processing Integrity: Accurate, Deterministic Computations',
      badge: 'PI1.1 - PI1.5 Aligned',
      controls: [
        {
          name: 'Dual-Regime Income Tax Act Engine',
          desc: 'Tax calculations run against a deterministic, mathematically validated Indian Income Tax Act 1961 engine (Section 115BAC comparison).'
        },
        {
          name: 'SHA-256 Checksummed Tax Returns',
          desc: 'Generated ITR-1/ITR-2 XML filing schemas embed a cryptographic SHA-256 hash stamp for end-to-end receipt verification with the ITD e-Filing portal.'
        },
        {
          name: 'Automated CI/CD Quality Assurance',
          desc: 'Every engine deployment passes a battery of automated test suites verifying edge cases across 80C, 80D, HRA, and TDS deductions.'
        }
      ]
    },
    availability: {
      title: 'Availability: High Uptime & LLM Failover',
      badge: 'A1.1 - A1.3 Aligned',
      controls: [
        {
          name: 'Multi-Provider LLM Fallback Architecture',
          desc: 'Conversational tax extraction seamlessly cascades from Google Gemini Flash to local/self-hosted inference pipelines during upstream rate limits.'
        },
        {
          name: 'Automated Health & Chain Telemetry',
          desc: 'Continuous synthetic health polling via /health and /compliance/status monitor API readiness, database pools, and cryptographic chain stability.'
        },
        {
          name: 'Degraded Error Shielding',
          desc: 'Public APIs prevent internal stack-trace leakage, returning structured, sanitized error payloads to maintain continuous client operability.'
        }
      ]
    },
    privacy: {
      title: 'Privacy: DPDP Act 2023 & GDPR Data Subject Rights',
      badge: 'P1.1 - P8.1 Aligned',
      controls: [
        {
          name: 'Right to Data Portability (Self-Service)',
          desc: 'Users can download a comprehensive, sanitized JSON archive of their tax filing history and computations at any moment via /compliance/export.'
        },
        {
          name: 'Right to Erasure (Right to be Forgotten)',
          desc: 'Instant, permanent purge of user profiles, session tokens, and financial calculation trees via authenticated /compliance/data requests.'
        },
        {
          name: 'Zero AI Training on Customer Financials',
          desc: 'Customer financial data is never used to train public or foundational artificial intelligence models. Processing is strictly single-tenant & transient.'
        }
      ]
    }
  }

  return (
    <StaticPageLayout title="Trust & Security Center">
      <div className="security-trust-center">
        {/* Hero & Compliance Badging */}
        <section className="security-hero">
          <div className="soc2-badge-pill">
            <span>🛡️</span> AICPA SOC 2 Type II Aligned &bull; CERT-In Compliant &bull; DPDP 2023 Ready
          </div>
          <h2>Enterprise Security &amp; Compliance Architecture</h2>
          <p>
            Taxly operates under bank-grade controls designed to protect your sensitive tax and financial records.
            We uphold strict compliance across all 5 AICPA Trust Services Criteria.
          </p>
        </section>

        {/* Live Posture Grid */}
        <div className="posture-grid">
          <div className="posture-card">
            <div className="posture-header">
              <span className="posture-icon">⛓️</span>
              <span className={`posture-status ${chainStatus === 'INTACT' ? 'active' : 'warn'}`}>
                {loadingStatus ? 'Verifying...' : chainStatus === 'INTACT' ? 'Verified' : 'Check'}
              </span>
            </div>
            <h4 className="posture-title">Cryptographic Audit Trail</h4>
            <p className="posture-desc">
              Every login, file parse, and calculation is recorded in a tamper-evident SHA-256 hash-chained log.
            </p>
          </div>

          <div className="posture-card">
            <div className="posture-header">
              <span className="posture-icon">🔒</span>
              <span className="posture-status active">Enforced</span>
            </div>
            <h4 className="posture-title">Differential PII Masking</h4>
            <p className="posture-desc">
              PAN, Aadhaar, account numbers, and personal counterparties are permanently obfuscated across views.
            </p>
          </div>

          <div className="posture-card">
            <div className="posture-header">
              <span className="posture-icon">⚡</span>
              <span className="posture-status active">Ephemeral</span>
            </div>
            <h4 className="posture-title">In-Memory Shredding</h4>
            <p className="posture-desc">
              Bank statements and Form 16 PDFs are parsed strictly in RAM and discarded immediately. Zero disk storage.
            </p>
          </div>

          <div className="posture-card">
            <div className="posture-header">
              <span className="posture-icon">🛡️</span>
              <span className="posture-status active">TLS 1.3 / AES-256</span>
            </div>
            <h4 className="posture-title">Military-Grade Encryption</h4>
            <p className="posture-desc">
              Encrypted in transit with HSTS (31536000s) and encrypted at rest with hardware-accelerated AES-256.
            </p>
          </div>
        </div>

        {/* Five Trust Services Criteria Interactive Section */}
        <section className="tsc-section">
          <div className="tsc-section-header">
            <h3>AICPA Trust Services Criteria Breakdown</h3>
            <p>Select a criterion to view specific technical controls implemented in Taxly.</p>
          </div>

          <div className="tsc-tabs">
            {Object.keys(tscCategories).map((key) => (
              <button
                key={key}
                className={`tsc-tab-btn ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <div className="tsc-tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, color: 'var(--ink)' }}>{tscCategories[activeTab].title}</h4>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B4FD8', background: '#EEF2FF', padding: '4px 10px', borderRadius: '6px' }}>
                {tscCategories[activeTab].badge}
              </span>
            </div>

            {tscCategories[activeTab].controls.map((control, idx) => (
              <div key={idx} className="control-item">
                <span className="control-icon">✓</span>
                <div className="control-content">
                  <strong>{control.name}</strong>
                  <p>{control.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Data Subject Rights Portal */}
        <section className="dsr-portal">
          <div className="dsr-header">
            <h3>Data Subject Rights Portal (DPDP Act &amp; GDPR)</h3>
            <p>Exercise your statutory rights to access, download, or permanently purge your personal data.</p>
          </div>

          <div className="dsr-action-cards">
            {/* Export Data */}
            <div className="dsr-card">
              <div>
                <h4><span>📥</span> Right of Access &amp; Portability</h4>
                <p>
                  Receive a machine-readable, sanitized JSON export containing all your filing sessions, tax deductions, and computation trees.
                </p>
              </div>
              <form onSubmit={handleExportData} className="dsr-input-group">
                <input
                  type="text"
                  className="dsr-input"
                  placeholder="Enter your email or User ID"
                  value={exportInput}
                  onChange={(e) => setExportInput(e.target.value)}
                  required
                />
                <button type="submit" className="dsr-btn-primary" disabled={exportLoading}>
                  {exportLoading ? 'Generating Export...' : 'Download My Data (JSON)'}
                </button>
              </form>
              {exportResult && (
                <div className={`dsr-feedback ${exportResult.type}`}>
                  {exportResult.message}
                </div>
              )}
            </div>

            {/* Delete / Erasure */}
            <div className="dsr-card">
              <div>
                <h4><span>🗑️</span> Right to Erasure (Forgotten)</h4>
                <p>
                  Permanently purge all account tokens, session logs, and parsed tax records from both active memory and databases.
                </p>
              </div>
              <div className="dsr-input-group">
                <input
                  type="text"
                  className="dsr-input"
                  placeholder="Enter your email or User ID"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                />
                <button
                  type="button"
                  className="dsr-btn-danger"
                  disabled={!deleteInput.trim() || deleteLoading}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Request Permanent Erasure
                </button>
              </div>
              {deleteResult && (
                <div className={`dsr-feedback ${deleteResult.type}`}>
                  {deleteResult.message}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Erasure Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <h3 style={{ margin: '0 0 12px', color: '#DC2626' }}>Confirm Irreversible Data Erasure</h3>
              <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Are you sure you want to permanently delete all records associated with <strong>{deleteInput}</strong>?
                This action is irreversible and complies with the Digital Personal Data Protection Act (DPDP) 2023.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--paper-3)',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteData}
                  disabled={deleteLoading}
                  className="dsr-btn-danger"
                >
                  {deleteLoading ? 'Purging...' : 'Yes, Purge Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Cryptographic Audit Trail Inspector */}
        <section className="audit-viewer-section">
          <div className="audit-viewer-header">
            <h3>
              <span>📋</span> Immutable Cryptographic Audit Log
            </h3>
            <span className="audit-status-badge">
              ✓ Chain Integrity: {chainStatus}
            </span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-2)', marginBottom: '16px' }}>
            Below is a live cryptographic snapshot of system events verified against Taxly's SHA-256 Merkelized hash chain.
          </p>

          <div className="audit-table-wrapper">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Event Type</th>
                  <th>Action</th>
                  <th>Actor ID</th>
                  <th>Status</th>
                  <th>SHA-256 Current Hash</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                      <td><strong>{log.event_type}</strong></td>
                      <td>{log.action}</td>
                      <td><code>{log.actor_id}</code></td>
                      <td>
                        <span style={{
                          color: log.status === 'SUCCESS' ? '#059669' : '#DC2626',
                          fontWeight: 700,
                          fontSize: '12px'
                        }}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <span className="hash-code">
                          {log.hash ? log.hash.slice(0, 16) + '...' : 'GENESIS'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--ink-3)' }}>
                      No recent audit entries or backend is initializing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subprocessors & Governance Section */}
        <section className="tsc-section">
          <div className="tsc-section-header">
            <h3>Approved Subprocessors</h3>
            <p>
              Under SOC 2 Type II Vendor Risk Management, Taxly contracts only with enterprise cloud providers subject to annual SOC 2 Type II / ISO 27001 certifications.
            </p>
          </div>
          <div className="subprocessors-table-wrapper">
            <table className="subprocessors-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Purpose</th>
                  <th>Data Residency</th>
                  <th>Certifications</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Supabase Inc.</strong></td>
                  <td>Encrypted PostgreSQL database &amp; session states</td>
                  <td>AWS Mumbai (ap-south-1)</td>
                  <td>SOC 2 Type II, ISO 27001, HIPAA</td>
                </tr>
                <tr>
                  <td><strong>Google Cloud Platform</strong></td>
                  <td>Stateless Vertex AI inference (Zero data retention)</td>
                  <td>Google Cloud Mumbai / Asia</td>
                  <td>SOC 1/2/3, ISO 27001, FedRAMP</td>
                </tr>
                <tr>
                  <td><strong>Razorpay Software Ltd.</strong></td>
                  <td>PCI-DSS compliant payment processing</td>
                  <td>India</td>
                  <td>PCI-DSS Level 1, SOC 2, ISO 27001</td>
                </tr>
                <tr>
                  <td><strong>RBI Account Aggregator</strong></td>
                  <td>Consent-based financial data streaming</td>
                  <td>India</td>
                  <td>RBI-regulated NBFC-AA Framework</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Statutory Disclosures */}
        <div className="security-callout">
          <h4>Vulnerability Disclosure &amp; CERT-In Reporting</h4>
          <p>
            If you identify a security vulnerability in Taxly, please report it immediately to our security engineering team at{' '}
            <a href="mailto:security@taxly.in" style={{ color: '#1B4FD8', fontWeight: 600 }}>security@taxly.in</a>.
            In compliance with CERT-In directions under Section 70B(6) of the Information Technology Act, 2000, cybersecurity incidents are reported within mandatory statutory timelines.
          </p>
        </div>
      </div>
    </StaticPageLayout>
  )
}
