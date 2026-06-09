import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app

client = TestClient(app)

@patch("httpx.post")
def test_send_otp_success(mock_post):
    mock_post.return_value.status_code = 200
    response = client.post("/auth/send-otp", json={"email": "test@taxly.in"})
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"

def test_verify_otp_success():
    from backend.main import otp_store
    import time
    otp_store["test@taxly.in"] = {
        "otp": "123456",
        "expires_at": time.time() + 600
    }
    response = client.post("/auth/verify-otp", json={"email": "test@taxly.in", "otp": "123456"})
    assert response.status_code == 200
    assert "token" in response.json()

def test_verify_otp_failure():
    from backend.main import otp_store
    import time
    otp_store["test@taxly.in"] = {
        "otp": "123456",
        "expires_at": time.time() + 600
    }
    response = client.post("/auth/verify-otp", json={"email": "test@taxly.in", "otp": "000000"})
    assert response.status_code == 401
