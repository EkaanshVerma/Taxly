import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.main import app
import os
import hmac
import hashlib
import json
from backend.conversation_engine import create_session

client = TestClient(app)

@patch("razorpay.Client")
def test_create_order(mock_razorpay):
    mock_order = mock_razorpay.return_value.order.create
    mock_order.return_value = {"id": "order_123"}
    
    session_id = create_session("test_user")
    
    response = client.post(f"/sessions/{session_id}/pay")
    assert response.status_code == 200
    assert response.json()["order_id"] == "order_123"
    assert response.json()["amount"] == 49900
    assert response.json()["currency"] == "INR"

def test_webhook_signature_valid():
    session_id = create_session("test_user")
    
    payload = {
        "payload": {
            "payment": {
                "entity": {
                    "notes": {
                        "session_id": session_id,
                        "email": "test@example.com"
                    }
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode()
    
    secret = "test_key_secret"
    os.environ["RAZORPAY_KEY_SECRET"] = secret
    
    signature = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    
    with patch("resend.Emails.send") as mock_send:
        response = client.post(
            "/razorpay/webhook",
            content=payload_bytes,
            headers={"X-Razorpay-Signature": signature}
        )
        assert response.status_code == 200
        mock_send.assert_called_once()
        
    # Check that session generate_xml now returns 400 (session not complete) instead of 402
    response2 = client.post(f"/sessions/{session_id}/generate-xml", json={"taxpayer": {}})
    assert response2.status_code == 400
    assert response2.json()["detail"] == "Session not complete"

def test_webhook_signature_invalid():
    payload = {"dummy": "data"}
    payload_bytes = json.dumps(payload).encode()
    
    response = client.post(
        "/razorpay/webhook",
        content=payload_bytes,
        headers={"X-Razorpay-Signature": "invalid_signature"}
    )
    assert response.status_code == 400

def test_webhook_email_failure_silent():
    session_id = create_session("test_user")
    
    payload = {
        "payload": {
            "payment": {
                "entity": {
                    "notes": {
                        "session_id": session_id,
                        "email": "test@example.com"
                    }
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode()
    
    secret = "test_key_secret"
    os.environ["RAZORPAY_KEY_SECRET"] = secret
    signature = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    
    with patch("resend.Emails.send", side_effect=Exception("Email failed")):
        response = client.post(
            "/razorpay/webhook",
            content=payload_bytes,
            headers={"X-Razorpay-Signature": signature}
        )
        assert response.status_code == 200 # Should not fail
