import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app

client = TestClient(app)

@patch("httpx.post")
def test_send_otp_success(mock_post):
    mock_post.return_value.status_code = 200
    response = client.post("/auth/send-otp", json={"phone": "9876543210"})
    assert response.status_code == 200
    assert response.json()["message"] == "OTP sent"

@patch("httpx.get")
@patch("backend.main._init_supabase") # Mock to avoid DB in test
def test_verify_otp_success(mock_init_supabase, mock_get):
    import os
    os.environ["MSG91_AUTH_KEY"] = "test_key"
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"type": "success"}
    
    response = client.post("/auth/verify-otp", json={"phone": "9876543210", "otp": "123456"})
    assert response.status_code == 200
    assert "token" in response.json()

@patch("httpx.get")
def test_verify_otp_failure(mock_get):
    import os
    os.environ["MSG91_AUTH_KEY"] = "test_key"
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {"type": "error"}
    
    response = client.post("/auth/verify-otp", json={"phone": "9876543210", "otp": "000000"})
    assert response.status_code == 401
