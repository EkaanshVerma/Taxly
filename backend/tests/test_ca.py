import pytest
from fastapi.testclient import TestClient
from backend.main import app, local_ca_accounts
import uuid

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_teardown():
    local_ca_accounts.clear()
    yield
    local_ca_accounts.clear()

def test_ca_register():
    test_email = f"testca_{uuid.uuid4().hex}@taxly.in"
    response = client.post("/ca/register", json={
        "name": "Test CA",
        "email": test_email,
        "phone": "9999999999",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_ca_login():
    test_email = f"testca_{uuid.uuid4().hex}@taxly.in"
    # First register
    client.post("/ca/register", json={
        "name": "Test CA",
        "email": test_email,
        "phone": "9999999999",
        "password": "password123"
    })
    
    # Then login
    response = client.post("/ca/login", json={
        "email": test_email,
        "password": "password123"
    })
    assert response.status_code == 200
    assert "token" in response.json()

def test_ca_login_wrong_password():
    test_email = f"testca_{uuid.uuid4().hex}@taxly.in"
    client.post("/ca/register", json={
        "name": "Test CA",
        "email": test_email,
        "phone": "9999999999",
        "password": "password123"
    })
    
    response = client.post("/ca/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_clients_requires_auth():
    response = client.get("/ca/clients")
    assert response.status_code == 401

def test_delete_session():
    import backend.conversation_engine as ce
    # Create a session
    session_id = ce.create_session("test_user_delete")
    
    # Ensure it exists
    assert session_id in ce.local_sessions or (ce.supabase_client and True)
    
    # Delete it via endpoint
    response = client.delete(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json() == {"message": "deleted"}
    
    # Ensure it's deleted
    if not ce.supabase_client:
        assert session_id not in ce.local_sessions

def test_delete_session_not_found():
    response = client.delete("/sessions/invalid_session_id_123")
    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}
