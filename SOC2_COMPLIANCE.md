# Taxly &mdash; SOC 2 Type II System Description & Compliance Specification

**Document Version:** 2.0.0  
**Effective Date:** October 2026  
**Auditor Framework:** AICPA Trust Services Criteria (TSP Section 100 / 2017 & 2022 Revisions)  
**Regulatory Harmonization:** India Digital Personal Data Protection (DPDP) Act 2023, CERT-In Cyber Security Directions (2022), IT Rules 2021, and GDPR.

---

## 1. Executive Summary & Audit Scope

Taxly provides an automated plain-English tax filing and Chartered Accountant (CA) review platform for Indian individual and corporate taxpayers. This document constitutes the formal **System Description** and **Control Activities Matrix** supporting Taxly's SOC 2 Type II compliance program.

The audit boundaries encompass all components of the Taxly production environment:
- **API Engine:** FastAPI (`backend/main.py`, `backend/security.py`)
- **Conversational & Deduction Engine:** Deterministic rule engine and LLM middleware (`backend/conversation_engine.py`, `backend/tds_parser.py`)
- **Client Application:** React 19 / Vite Single Page Application (`frontend/`)
- **Persistence & Secrets:** Supabase PostgreSQL (AWS Mumbai) and environment-gated cryptographic key stores
- **External Subprocessors:** Google Cloud Vertex AI, Razorpay, and RBI-regulated Account Aggregators

---

## 2. AICPA Trust Services Criteria (TSC) Mapping

| Criteria | Trust Category | Implementation Highlights | Verification Endpoint |
|---|---|---|---|
| **CC1.0 – CC9.0** | **Common Criteria / Security** | Strict HSTS, CSP, X-Frame-Options, SHA-256 hash-chained audit logging, sliding-window rate limiting, magic-byte file validation. | `GET /compliance/audit-logs`<br>`GET /health` |
| **C1.1 – C1.2** | **Confidentiality** | Ephemeral in-memory file parsing (zero unencrypted disk retention), PII redaction for PAN/Aadhaar/phones/emails, AES-256 encryption at rest, TLS 1.3 in transit. | `GET /compliance/status`<br>`test_pii_masking` |
| **PI1.1 – PI1.5** | **Processing Integrity** | Deterministic dual-regime Income Tax Act (Sec 115BAC) computation engine, SHA-256 checksums embedded in generated ITR-1 XML schemas. | `POST /sessions/{id}/generate-xml`<br>`test_processing_integrity` |
| **A1.1 – A1.3** | **Availability** | Multi-tier LLM failover architecture (Gemini Flash &rarr; local Ollama/DeepSeek), continuous synthetic health telemetry, graceful error degradation. | `GET /health`<br>`test_availability` |
| **P1.1 – P8.1** | **Privacy** | Self-service Right of Access & Data Portability, Right to Erasure / Forgotten, consent logging, zero AI training on customer financial records. | `POST /compliance/export`<br>`DELETE /compliance/data` |

---

## 3. Detailed Control Activities Matrix

### 3.1 Security (Common Criteria: CC1 – CC9)

#### CC5.1 & CC6.1 &mdash; Logical Access & Authentication Controls
- **Password Complexity Policy:** CA registrations require a minimum of 8 characters containing at least 1 uppercase letter, 1 lowercase letter, 1 numeric digit, and 1 special character (`validate_password_complexity` in `backend/security.py`).
- **OTP / Multi-Factor Authentication:** User login utilizes time-limited cryptographic One-Time Passwords (OTPs) dispatched over verified email or SMS channels, with maximum validity windows and strict brute-force rate limits.
- **Role-Based Access Control (RBAC):** Chartered Accountants are granted scoped access exclusively to assigned taxpayer sessions. CA approval status is verified on every privileged action.

#### CC6.6 & CC6.7 &mdash; Network Boundary & Application Hardening
- **Strict Transport Security (HSTS):** Injected via `SOC2SecurityMiddleware` with `max-age=31536000; includeSubDomains; preload`.
- **Content Security Policy (CSP):** `default-src 'self'; frame-ancestors 'none'; object-src 'none'`.
- **Anti-Clickjacking & MIME Protection:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Adaptive Rate Limiting:** Sliding-window rate limiter (`RateLimiter` in `backend/security.py`) enforces:
  - Default API requests: 120 requests/minute
  - Authentication (`/auth/*`): 15 requests/minute
  - File upload (`/upload-*`): 10 requests/minute
  - Tax calculation (`/calculate`, `/generate-xml`): 30 requests/minute
  - Exceeded quotas return HTTP `429 Too Many Requests` with RFC `Retry-After` headers.

#### CC6.8 & CC7.2 &mdash; Input Validation & Threat Prevention
- **Magic-Byte Binary Validation:** File uploads (`validate_pdf_file`) verify the `%PDF-` binary magic bytes (first 5 bytes of stream), reject files exceeding 10MB, and enforce strict MIME and `.pdf` extension whitelisting to prevent remote code execution (RCE).
- **CORS Whitelist:** Explicit CORS configuration prevents wildcard (`*`) origins in production, restricting cross-origin requests to verified Taxly domains.

#### CC7.1 & CC7.3 &mdash; Cryptographic Audit Trail
- **Immutable Log Chaining:** `AuditLogger` writes events to an append-only JSONL log (`audit_trail.jsonl`). Each log record calculates its SHA-256 hash chained to the preceding record's hash (`prev_hash`).
- **Chain Verification:** `AuditLogger.verify_integrity()` computes and validates the entire hash chain from the genesis block forward. Any unauthorized file modification breaks the chain and triggers an alert.

---

### 3.2 Confidentiality (C1.1 – C1.2)

- **Ephemeral Document Processing:** Form 16, Form 26AS, and bank statement PDFs are parsed strictly within temporary in-memory buffers (`io.BytesIO`) by `pdfminer` and `tds_parser`. No unencrypted raw PDF files are stored on disk or persistent cloud buckets.
- **Differential PII Masking:**
  - **Permanent PAN Masking:** `AAAAA0000A` &rarr; `AAAAA****A`
  - **Aadhaar Masking:** `1234 5678 9012` &rarr; `********9012`
  - **Phone Masking:** `+91 9876543210` &rarr; `+91 ******3210`
  - **Email Masking:** `alex.doe@example.com` &rarr; `a***e@example.com`
  - **Bank Account Masking:** `123456789012` &rarr; `********9012`
- **External AI Sanitization:** All user chat prompts pass through `sanitize_free_text_pii` in `conversation_engine.py` prior to dispatching prompts to external LLM APIs, preventing unintentional training leakage.
- **Encryption at Rest:** Supabase PostgreSQL database tables utilize hardware-accelerated AES-256 transparent encryption.
- **Encryption in Transit:** TLS 1.3 enforced on all external endpoints.

---

### 3.3 Processing Integrity (PI1.1 – PI1.5)

- **Deterministic Income Tax Act Engine:** Computations compare the Old Regime (incorporating Section 80C up to ₹1,50,000, 80D medical insurance, HRA exemption under Section 10(13A), standard deduction ₹50,000) against the New Regime under Section 115BAC (standard deduction ₹75,000, 87A rebate up to ₹7,00,000).
- **Cryptographic XML Schema Checksum:** Generated ITR XML files compute a SHA-256 checksum embedded in the payload response (`checksum_sha256`) and download headers, ensuring bit-for-bit filing receipt verification with the Income Tax Department (ITD) e-Filing portal.
- **Automated Regression Quality Assurance:** Continuous automated unit tests in `backend/tests/test_soc2_compliance.py` validate processing integrity, calculation repeatability, and schema stability.

---

### 3.4 Availability (A1.1 – A1.3)

- **Multi-Provider LLM Cascades:** The conversation engine cascades from Google Gemini 2.5 Flash to local/on-premise Ollama / DeepSeek models during upstream network interruptions or quota limits.
- **Health Telemetry:** `GET /health` returns live health status of the database connectivity, API subsystem, and cryptographic audit log chain integrity.
- **Fail-Safe Exception Handling:** APIs wrap uncaught exceptions in sanitizing middleware, preventing internal stack traces or environment variables from leaking in HTTP responses.

---

### 3.5 Privacy (DPDP Act 2023 & GDPR Harmonization: P1.1 – P8.1)

- **Data Subject Right of Access & Portability:**
  - Route: `POST /compliance/export`
  - Accepts user identifier (`user_id` or `email`).
  - Returns a sanitized, portable JSON package containing all filing sessions, tax deductions, and computation trees.
- **Right to Erasure (Right to be Forgotten):**
  - Route: `DELETE /compliance/data`
  - Accepts user identifier or session ID.
  - Permanently purges user account records, conversational transcripts, and calculation trees from in-memory caches and persistent databases.
- **Zero AI Model Training:** Customer financial and tax data is never used to train public or foundational AI models.
- **Statutory Grievance Redressal:** A dedicated Grievance Officer is designated in compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.

---

## 4. Third-Party Subprocessor Governance

Under SOC 2 Vendor Risk Management (CC9.2), Taxly requires all third-party subprocessors to maintain valid SOC 2 Type II or ISO 27001 certifications:

| Subprocessor | Service Provided | Primary Data Center | Certifications |
|---|---|---|---|
| **Supabase Inc.** | Managed PostgreSQL database | AWS Mumbai (`ap-south-1`) | SOC 2 Type II, ISO 27001, HIPAA |
| **Google Cloud Platform** | Vertex AI LLM inference (Stateless) | Google Cloud Mumbai / Asia | SOC 1/2/3, ISO 27001, FedRAMP |
| **Razorpay Software Ltd.** | Payment Gateway | India | PCI-DSS Level 1, SOC 2 Type II |
| **RBI Account Aggregators** | Consent-based financial data stream | India | RBI-regulated NBFC-AA Framework |

---

## 5. Security Incident Response & CERT-In Reporting

In compliance with the **Cyber Security Directions (2022)** issued by the Indian Computer Emergency Response Team (CERT-In) under Section 70B(6) of the Information Technology Act, 2000:
1. **Reporting Window:** Cyber security incidents (e.g., unauthorized access, data compromise, DoS events) must be reported to CERT-In within **6 hours** of notice.
2. **Log Retention:** In accordance with CERT-In directions, system and audit logs are retained in a secure, tamper-evident store for a minimum of **180 days**.
3. **Point of Contact:**
   - **Grievance Officer:** Ekaansh Verma
   - **Security Team Email:** `security@taxly.in`
   - **Grievance Desk Email:** `grievance@taxly.in`
   - **SLA:** Acknowledged within 24 hours; resolved within 15 calendar days.

---

## 6. Verification & Automated Audit Test Suite

The SOC 2 compliance posture can be audited on demand using the automated test suite:

```bash
cd backend
source venv/bin/activate
PYTHONPATH=. python3 tests/test_soc2_compliance.py
```

### Automated Audit Controls Executed:
1. `test_security_headers_present`: Verifies HSTS, CSP, X-Frame-Options, and X-Content-Type-Options.
2. `test_rate_limiter_throttles_bursts`: Validates sliding-window HTTP 429 throttling and Retry-After headers.
3. `test_pii_masking_pan_aadhaar_phone_email`: Validates redaction of PAN, Aadhaar, phone, email, and bank account numbers.
4. `test_llm_prompt_pii_sanitization`: Verifies free-text redaction of sensitive identifiers before LLM prompts.
5. `test_magic_byte_pdf_validation`: Tests rejection of invalid/malicious files and acceptance of `%PDF-` streams.
6. `test_password_complexity`: Tests enforcement of uppercase, lowercase, number, and special character rules.
7. `test_audit_logger_hash_chain_integrity`: Validates cryptographic SHA-256 chaining and tamper detection.
8. `test_compliance_status_endpoint`: Tests `GET /compliance/status` readiness matrix across all 5 TSCs.
9. `test_compliance_export_endpoint`: Tests `POST /compliance/export` data portability functionality.
10. `test_compliance_erasure_endpoint`: Tests `DELETE /compliance/data` right-to-erasure functionality.
11. `test_processing_integrity_checksum`: Validates deterministic tax computation and XML checksum stamping.
