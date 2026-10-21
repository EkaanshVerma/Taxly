"""
Tests for SOC 2 Type II Compliance Controls:
- CC6.1 / CC6.2: Password Complexity & Authentication
- CC6.6: Security Headers, Request ID Tracing, Rate Limiting
- CC6.7: PII Masking & Data Sanitization
- CC6.8: Safe File Upload (Magic bytes & size limit)
- CC7.2 / CC7.3: Tamper-Evident Audit Logging & SHA-256 Chain Integrity
- PI1.1 / PI1.2: Cryptographic Filing Checksums
- P4.0 / P6.0: Data Portability Export & Right to Erasure
"""

import pytest
try:
    from backend.main import (
        app,
        get_compliance_status,
        get_compliance_audit_logs,
        compliance_data_export,
        compliance_data_erasure,
        ComplianceExportRequest,
        ComplianceDeleteRequest,
        health
    )
    from backend.security import (
        mask_pan,
        mask_aadhaar,
        mask_phone,
        mask_email,
        mask_account_number,
        sanitize_free_text_pii,
        validate_password_complexity,
        validate_pdf_file,
        compute_sha256_checksum,
        audit_logger,
        rate_limiter,
        SOC2SecurityMiddleware
    )
except ModuleNotFoundError:
    from main import (
        app,
        get_compliance_status,
        get_compliance_audit_logs,
        compliance_data_export,
        compliance_data_erasure,
        ComplianceExportRequest,
        ComplianceDeleteRequest,
        health
    )
    from security import (
        mask_pan,
        mask_aadhaar,
        mask_phone,
        mask_email,
        mask_account_number,
        sanitize_free_text_pii,
        validate_password_complexity,
        validate_pdf_file,
        compute_sha256_checksum,
        audit_logger,
        rate_limiter,
        SOC2SecurityMiddleware
    )

from starlette.testclient import TestClient
client = TestClient(app)

# ------------------------------------------------------------------------------
# 1. CC6.6 Security Headers & Request Tracing
# ------------------------------------------------------------------------------

def test_security_headers_present():
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers

    # Check required SOC 2 boundary headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")
    assert "default-src 'self'" in headers.get("Content-Security-Policy", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "X-Request-ID" in headers
    assert len(headers["X-Request-ID"]) > 0

# ------------------------------------------------------------------------------
# 2. CC6.1 Password Policy & Authentication
# ------------------------------------------------------------------------------

def test_password_complexity():
    # Too short
    ok, msg = validate_password_complexity("Short1!")
    assert not ok
    assert "8 characters" in msg

    # No uppercase
    ok, msg = validate_password_complexity("lowercase123!")
    assert not ok
    assert "uppercase" in msg

    # No lowercase
    ok, msg = validate_password_complexity("UPPERCASE123!")
    assert not ok
    assert "lowercase" in msg

    # No digits
    ok, msg = validate_password_complexity("NoDigitsHere!")
    assert not ok
    assert "number" in msg

    # No special character
    ok, msg = validate_password_complexity("ValidLength123")
    assert not ok
    assert "special character" in msg

    # Valid strong password
    ok, msg = validate_password_complexity("TaxlyStrongPass2026!")
    assert ok
    assert "meets complexity" in msg

def test_ca_register_rejects_weak_password():
    response = client.post("/ca/register", json={
        "name": "CA Test",
        "email": "weak_ca@taxly.in",
        "password": "123"
    })
    assert response.status_code == 400
    assert "Password must be at least 8 characters" in response.json()["detail"]

# ------------------------------------------------------------------------------
# 3. CC6.7 PII Masking & Sanitization
# ------------------------------------------------------------------------------

def test_pii_masking_helpers():
    assert mask_pan("ABCDE1234F") == "ABCDE****F"
    assert mask_aadhaar("1234 5678 9012") == "********9012"
    assert mask_phone("+91 9876543210") == "******3210"
    assert mask_email("johndoe@example.com") == "j***e@example.com"
    assert mask_account_number("123456789012") == "********9012"

def test_free_text_pii_sanitization():
    raw_prompt = "Hello, my PAN is ABCDE1234F and my Aadhaar is 1234 5678 9012. Call me at 9876543210."
    sanitized = sanitize_free_text_pii(raw_prompt)

    assert "ABCDE****F" in sanitized
    assert "ABCDE1234F" not in sanitized
    assert "********9012" in sanitized
    assert "1234 5678 9012" not in sanitized
    assert "******3210" in sanitized
    assert "9876543210" not in sanitized

# ------------------------------------------------------------------------------
# 4. CC6.8 Input Validation & File Upload Safety
# ------------------------------------------------------------------------------

def test_file_upload_validation():
    # Non-PDF extension
    with pytest.raises(Exception):
        validate_pdf_file(b"%PDF-1.4 test", "malicious.exe")

    # Spoofed PDF (extension is .pdf but content lacks %PDF- header)
    with pytest.raises(Exception):
        validate_pdf_file(b"MZ\x90\x00\x03fake-content", "invoice.pdf")

    # Valid PDF signature
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    validate_pdf_file(valid_pdf_bytes, "tax_cert.pdf")

# ------------------------------------------------------------------------------
# 5. CC7.2 / CC7.3 Immutable Audit Logging & Cryptographic Chain
# ------------------------------------------------------------------------------

def test_audit_log_hash_chain():
    # Log test events
    audit_logger.log(
        event_type="TEST_EVENT_1",
        action="Run unit test 1",
        actor_id="tester-1",
        details={"pan": "ABCDE1234F"} # should be masked
    )
    audit_logger.log(
        event_type="TEST_EVENT_2",
        action="Run unit test 2",
        actor_id="tester-2",
        details={"email": "tester@taxly.in"}
    )

    # Verify cryptographic integrity
    is_valid, msg = audit_logger.verify_integrity()
    assert is_valid
    assert "verified successfully" in msg

    # Retrieve logs
    logs = audit_logger.get_logs(event_type="TEST_EVENT_1")
    assert len(logs) >= 1
    last_log = logs[-1]
    assert last_log["details"]["pan"] == "ABCDE****F"  # PII was masked

# ------------------------------------------------------------------------------
# 6. SOC 2 Compliance Endpoints
# ------------------------------------------------------------------------------

def test_compliance_status_endpoint():
    response = client.get("/compliance/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLIANT"
    assert "AICPA SOC 2 Type II" in data["standard"]
    tsc = data["trust_services_criteria"]
    assert tsc["security"]["status"] == "PASS"
    assert tsc["confidentiality"]["status"] == "PASS"
    assert tsc["processing_integrity"]["status"] == "PASS"
    assert tsc["availability"]["status"] == "PASS"
    assert tsc["privacy"]["status"] == "PASS"
    assert data["audit_trail"]["cryptographic_chain_status"] == "INTACT"

def test_compliance_audit_logs_endpoint():
    response = client.get("/compliance/audit-logs?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["integrity_verified"] is True
    assert "logs" in data
    assert isinstance(data["logs"], list)

def test_compliance_export_and_erasure():
    # 1. Create session
    sess_res = client.post("/sessions", json={"user_id": "soc2-user-99"})
    session_id = sess_res.json()["session_id"]

    # 2. Export user data (Right to Data Portability)
    export_res = client.post("/compliance/export", json={"user_id": "soc2-user-99"})
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["user_id"] == "soc2-user-99"

    # 3. Purge user data (Right to Erasure)
    del_res = client.request("DELETE", "/compliance/data", json={"session_id": session_id})
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["status"] == "PURGED"

# ------------------------------------------------------------------------------
# 7. Processing Integrity Checksum
# ------------------------------------------------------------------------------

def test_sha256_checksum():
    xml_content = "<ITR><GrossSalary>1200000</GrossSalary></ITR>"
    checksum = compute_sha256_checksum(xml_content)
    assert len(checksum) == 64
    # Deterministic
    assert checksum == compute_sha256_checksum(xml_content)
