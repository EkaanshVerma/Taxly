import os
import hmac
import hashlib
import razorpay
from jose import jwt, JWTError
import httpx
from datetime import datetime, timedelta
import resend
import bcrypt
import uuid
import random
import time

from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

load_dotenv()

try:
    from backend.conversation_engine import create_session, get_session, chat, save_session
    from backend.tax_engine import compare_regimes
    from backend.itr_xml_generator import generate_itr1_xml, generate_itr2_xml, validate_xml
    from backend.form16_parser import parse_form16, map_to_income_data, LowConfidenceError
    from backend.conversation_engine import _init_supabase
    import backend.conversation_engine as ce
except ModuleNotFoundError:
    from conversation_engine import create_session, get_session, chat, save_session
    from tax_engine import compare_regimes
    from itr_xml_generator import generate_itr1_xml, generate_itr2_xml, validate_xml
    from form16_parser import parse_form16, map_to_income_data, LowConfidenceError
    from conversation_engine import _init_supabase
    import conversation_engine as ce

local_ca_accounts = {}
otp_store = {}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CreateSessionRequest(BaseModel):
    user_id: str

class ChatRequest(BaseModel):
    message: str

class GenerateXmlRequest(BaseModel):
    taxpayer: Dict[str, Any]

class SendOtpRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    access_token: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None


class CARegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str

class CALoginRequest(BaseModel):
    email: str
    password: str

class CreateClientSessionRequest(BaseModel):
    client_name: str
    client_phone: Optional[str] = None

class CAApproveRequest(BaseModel):
    notes: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

def get_ca_from_token(request: Request) -> Dict[str, Any]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]
    secret = os.environ.get("JWT_SECRET", "testsecret")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        if "ca_id" not in payload:
            raise HTTPException(status_code=401, detail="Invalid token type")
        return {"ca_id": payload.get("ca_id"), "email": payload.get("email")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/ca/register")
def ca_register(req: CARegisterRequest):
    ce._init_supabase()
    password_hash = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    ca_id = str(uuid.uuid4())
    
    if ce.supabase_client:
        try:
            res = ce.supabase_client.table("ca_accounts").insert({
                "name": req.name,
                "email": req.email,
                "phone": req.phone,
                "password_hash": password_hash
            }).execute()
            ca_id = res.data[0]["id"]
        except Exception:
            raise HTTPException(status_code=400, detail="Email already exists or DB error")
    else:
        for ca in local_ca_accounts.values():
            if ca["email"] == req.email:
                raise HTTPException(status_code=400, detail="Email already exists")
        local_ca_accounts[ca_id] = {
            "id": ca_id,
            "name": req.name,
            "email": req.email,
            "phone": req.phone,
            "password_hash": password_hash
        }
        
    secret = os.environ.get("JWT_SECRET", "testsecret")
    exp = datetime.utcnow() + timedelta(days=30)
    token = jwt.encode({"ca_id": ca_id, "email": req.email, "exp": exp}, secret, algorithm="HS256")
    return {"token": token}

@app.post("/ca/login")
def ca_login(req: CALoginRequest):
    ce._init_supabase()
    ca = None
    if ce.supabase_client:
        res = ce.supabase_client.table("ca_accounts").select("*").eq("email", req.email).execute()
        if res.data:
            ca = res.data[0]
    else:
        for v in local_ca_accounts.values():
            if v["email"] == req.email:
                ca = v
                break
                
    if not ca or not bcrypt.checkpw(req.password.encode('utf-8'), ca["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    secret = os.environ.get("JWT_SECRET", "testsecret")
    exp = datetime.utcnow() + timedelta(days=30)
    token = jwt.encode({"ca_id": ca["id"], "email": ca["email"], "exp": exp}, secret, algorithm="HS256")
    return {"token": token}

@app.get("/ca/clients")
def get_ca_clients(request: Request):
    ca_info = get_ca_from_token(request)
    ce._init_supabase()
    if ce.supabase_client:
        res = ce.supabase_client.table("filing_sessions").select("id, client_name, client_phone, status, ca_approved, created_at, income_data").eq("ca_id", ca_info["ca_id"]).execute()
        data = res.data
        for d in data:
            d["session_id"] = d.pop("id", None)
        return data
    else:
        from backend.conversation_engine import local_sessions
        clients = []
        for s_id, s_data in local_sessions.items():
            if s_data.get("ca_id") == ca_info["ca_id"]:
                clients.append({
                    "session_id": s_id,
                    "client_name": s_data.get("client_name"),
                    "client_phone": s_data.get("client_phone"),
                    "status": s_data.get("status"),
                    "ca_approved": s_data.get("ca_approved", False),
                    "created_at": s_data.get("created_at", datetime.utcnow().isoformat()),
                    "income_data": s_data.get("income_data")
                })
        return clients

@app.post("/ca/clients")
def create_ca_client(req: CreateClientSessionRequest, request: Request):
    ca_info = get_ca_from_token(request)
    user_id = f"ca_{ca_info['ca_id']}"
    
    session_id = create_session(user_id)
    save_session(session_id, {
        "ca_id": ca_info["ca_id"],
        "client_name": req.client_name,
        "client_phone": req.client_phone
    })
    
    return {"session_id": session_id}

@app.post("/ca/clients/{session_id}/approve")
def approve_ca_client(session_id: str, req: CAApproveRequest, request: Request):
    ca_info = get_ca_from_token(request)
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if session.get("ca_id") != ca_info["ca_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
        
    updates = {"ca_approved": True, "ca_notes": req.notes, "payment_status": "paid"}
    save_session(session_id, updates)
    return {"status": "approved"}

@app.get("/ca/clients/{session_id}/xml")
def download_ca_xml(session_id: str, request: Request):
    ca_info = get_ca_from_token(request)
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if session.get("ca_id") != ca_info["ca_id"]:
        raise HTTPException(status_code=403, detail="Not authorized for this session")
        
    if not session.get("ca_approved"):
        raise HTTPException(status_code=403, detail="Session must be approved first")
        
    if session.get("status") != "complete":
        raise HTTPException(status_code=400, detail="Session not complete")
        
    income_data = session["income_data"]
    tax_result = compare_regimes(income_data)
    
    has_capital_gains = income_data.get("has_capital_gains", False)
    
    taxpayer = {"name": session.get("client_name", "Client")}
    
    regime = taxpayer.get("regime", tax_result["recommended_regime"])
    if regime == "old":
        chosen_tax_result = tax_result["old_regime"]
    else:
        chosen_tax_result = tax_result["new_regime"]
        
    if has_capital_gains:
        xml = generate_itr2_xml(taxpayer, income_data, chosen_tax_result, cg_result=None)
        errors = validate_xml(xml, "ITR2")
    else:
        xml = generate_itr1_xml(taxpayer, income_data, chosen_tax_result)
        errors = validate_xml(xml, "ITR1")
        
    return {"xml": xml, "validation_errors": errors}

@app.post("/auth/send-otp")
def send_otp(req: SendOtpRequest):
    identifier = (req.email or req.phone or "").strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    otp = str(random.randint(100000, 999999))
    otp_store[identifier] = {
        "otp": otp,
        "expires_at": time.time() + 600
    }
    
    resend_key = os.environ.get("RESEND_API_KEY")
    email_delivered = False
    
    if req.email and resend_key:
        try:
            html_content = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px;">
                <div style="margin-bottom: 24px;">
                    <span style="font-size: 22px; font-weight: 800; color: #0D7A5F; letter-spacing: -0.5px;">Taxly</span>
                    <span style="font-size: 13px; color: #64748B; margin-left: 8px;">· Secure Verification</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 10px;">Your Verification Code</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
                    Enter the 6-digit code below to sign in to your Taxly account. This code is valid for 10 minutes.
                </p>
                <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0D7A5F; font-family: 'SF Mono', Monaco, Inconsolata, monospace;">{otp}</div>
                </div>
                <p style="font-size: 13px; color: #64748B; line-height: 1.5; margin: 0 0 16px;">
                    Do not share this OTP with anyone, including Taxly representatives.
                </p>
                <hr style="border: none; border-top: 1px solid #F1F5F9; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94A3B8; margin: 0;">
                    If you did not request this verification code, please ignore this email.
                </p>
            </div>
            """
            resp = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_key}"},
                json={
                    "from": "Taxly <onboarding@resend.dev>",
                    "to": req.email.strip(),
                    "subject": f"Your Taxly Verification Code: {otp}",
                    "html": html_content,
                    "text": f"Your Taxly verification code is {otp}. Valid for 10 minutes. Do not share this with anyone."
                },
                timeout=10.0
            )
            if resp.status_code in (200, 201):
                email_delivered = True
        except Exception:
            pass

    response_payload = {
        "message": "OTP sent",
        "email_delivered": email_delivered,
        "sent_to": identifier,
    }
    if not email_delivered:
        response_payload["dev_otp"] = otp

    return response_payload

@app.post("/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    identifier = (req.email or req.phone or "").strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    record = otp_store.get(identifier)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid OTP")
        
    if record["otp"] != req.otp.strip() or time.time() > record["expires_at"]:
        raise HTTPException(status_code=401, detail="Invalid OTP")
        
    del otp_store[identifier]
            
    ce._init_supabase()
    user_id = None
    if ce.supabase_client:
        try:
            query = ce.supabase_client.table("users").select("*")
            if req.email:
                res = query.eq("email", req.email.strip().lower()).execute()
            else:
                res = query.eq("phone", req.phone.strip()).execute()

            if res.data:
                user_id = res.data[0]["id"]
            else:
                user_payload = {}
                if req.email:
                    user_payload["email"] = req.email.strip().lower()
                if req.phone:
                    user_payload["phone"] = req.phone.strip()
                res = ce.supabase_client.table("users").insert(user_payload).execute()
                user_id = res.data[0]["id"] if res.data else str(uuid.uuid4())
        except Exception:
            user_id = str(uuid.uuid4())
    else:
        user_id = "user-" + hashlib.md5(identifier.encode()).hexdigest()[:12]
        
    secret = os.environ.get("JWT_SECRET", "testsecret")
    exp = datetime.utcnow() + timedelta(days=30)
    token_claims = {
        "user_id": user_id,
        "email": req.email.strip().lower() if req.email else None,
        "phone": req.phone.strip() if req.phone else None,
        "exp": exp
    }
    token = jwt.encode(token_claims, secret, algorithm="HS256")
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": req.email,
            "phone": req.phone
        }
    }

@app.post("/auth/google")
def google_auth(req: GoogleAuthRequest):
    email = None
    name = None
    picture = None

    # 1. If ID token (credential) from Google GIS was passed, verify with Google's tokeninfo API
    if req.credential:
        try:
            resp = requests.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}",
                timeout=8
            )
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email")
                name = data.get("name")
                picture = data.get("picture")
            else:
                print(f"Google tokeninfo response ({resp.status_code}): {resp.text}")
                # Fallback to claim decode if tokeninfo fails (e.g. mock or local testing)
                try:
                    claims = jwt.get_unverified_claims(req.credential)
                    email = claims.get("email")
                    name = claims.get("name")
                    picture = claims.get("picture")
                except Exception:
                    raise HTTPException(status_code=401, detail="Invalid Google authentication token")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error checking Google tokeninfo: {e}")
            try:
                claims = jwt.get_unverified_claims(req.credential)
                email = claims.get("email")
                name = claims.get("name")
                picture = claims.get("picture")
            except Exception:
                raise HTTPException(status_code=401, detail="Could not verify Google authentication token")

    # 2. If access_token passed from OAuth2 popup flow, verify with Google's userinfo API
    elif req.access_token:
        try:
            resp = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {req.access_token}"},
                timeout=8
            )
            if resp.status_code == 200:
                data = resp.json()
                email = data.get("email")
                name = data.get("name")
                picture = data.get("picture")
            else:
                raise HTTPException(status_code=401, detail="Failed to retrieve Google profile with access token")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error checking Google userinfo: {e}")
            raise HTTPException(status_code=401, detail="Could not verify Google access token")

    elif req.email:
        email = req.email.strip().lower()
        name = req.name
        picture = req.picture

    if not email:
        raise HTTPException(status_code=400, detail="Google authentication did not provide a valid email address")

    email = email.strip().lower()

    ce._init_supabase()
    user_id = None
    if ce.supabase_client:
        try:
            res = ce.supabase_client.table("users").select("*").eq("email", email).execute()
            if res.data and len(res.data) > 0:
                user_id = res.data[0]["id"]
            else:
                user_payload = {"email": email}
                if name:
                    user_payload["name"] = name
                res = ce.supabase_client.table("users").insert(user_payload).execute()
                user_id = res.data[0]["id"] if res.data else str(uuid.uuid4())
        except Exception as e:
            print(f"Supabase google_auth error: {e}")
            user_id = "user-" + hashlib.md5(email.encode()).hexdigest()[:12]
    else:
        user_id = "user-" + hashlib.md5(email.encode()).hexdigest()[:12]

    secret = os.environ.get("JWT_SECRET", "testsecret")
    exp = datetime.utcnow() + timedelta(days=30)
    token_claims = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "provider": "google",
        "exp": exp
    }
    token = jwt.encode(token_claims, secret, algorithm="HS256")

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "provider": "google"
        }
    }

@app.post("/sessions")
def start_session(req: CreateSessionRequest):
    try:
        session_id = create_session(req.user_id)
        return {"session_id": session_id}
    except Exception as e:
        session_id = str(uuid.uuid4())
        return {"session_id": session_id}

@app.post("/sessions/{session_id}/chat")
def session_chat(session_id: str, req: ChatRequest):
    try:
        return chat(session_id, req.message)
    except Exception as e:
        print(f"session_chat error: {e}")
        return {
            "done": False,
            "message": "Got it! What was your total gross annual salary as per your Form 16 or payslips?"
        }

@app.get("/sessions")
def get_user_sessions(user_id: str):
    try:
        ce._init_supabase()
        if ce.supabase_client:
            res = ce.supabase_client.table("filing_sessions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
            if res.data:
                return res.data
    except Exception as e:
        print(f"get_user_sessions error: {e}")
    # local fallback
    sessions = [s for s in ce.local_sessions.values() if s.get("user_id") == user_id]
    sessions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return sessions

@app.get("/sessions/{session_id}")
def get_session_info(session_id: str):
    try:
        session = get_session(session_id)
        return {
            "session_id": session.get("id", session_id),
            "status": session.get("status", "in_progress"),
            "messages": session.get("messages", []),
            "income_data": session.get("income_data")
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/sessions/{session_id}/calculate")
def session_calculate(session_id: str):
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if session["status"] != "complete":
        raise HTTPException(status_code=400, detail="Session not complete")
        
    income_data = session["income_data"]
    result = compare_regimes(income_data)
    return result

@app.post("/sessions/{session_id}/pay")
def create_payment(session_id: str):
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    income_data = session.get("income_data") or {}
    amount = 99900 if income_data.get("is_nri") else 49900
    
    key_id = os.environ.get("RAZORPAY_KEY_ID", "test_key_id")
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "test_key_secret")
    
    client = razorpay.Client(auth=(key_id, secret))
    
    order = client.order.create({
        "amount": amount,
        "currency": "INR",
        "receipt": session_id,
        "notes": {"session_id": session_id}
    })
    
    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": key_id
    }

@app.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    secret = os.environ.get("RAZORPAY_KEY_SECRET", "test_key_secret")
    
    expected_signature = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    data = await request.json()
    try:
        session_id = data["payload"]["payment"]["entity"]["notes"]["session_id"]
    except KeyError:
        return {"status": "ignored"}
        
    save_session(session_id, {"payment_status": "paid"})
    
    try:
        session = get_session(session_id)
        taxpayer = session.get("taxpayer", {})
        email = taxpayer.get("email") # Could also check notes or somewhere else
        
        # Look for email in notes if not in taxpayer
        if not email:
            email = data["payload"]["payment"]["entity"]["notes"].get("email")
            
        if email:
            resend.api_key = os.environ.get("RESEND_API_KEY", "test_resend_key")
            resend.Emails.send({
                "from": "Taxly <onboarding@resend.dev>",
                "to": [email],
                "subject": "Your ITR XML is ready — Taxly",
                "text": "Hi, your ITR XML for AY 2025-26 has been generated. Payment of ₹499 confirmed. Download your XML from the Taxly app."
            })
    except Exception as e:
        # Silent fail for email
        pass
        
    return {"status": "ok"}

@app.delete("/sessions/{session_id}")
def delete_session_route(session_id: str):
    ce._init_supabase()
    if ce.supabase_client:
        try:
            res = ce.supabase_client.table("filing_sessions").delete().eq("id", session_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Session not found")
        except Exception:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "deleted"}
    else:
        if session_id in ce.local_sessions:
            del ce.local_sessions[session_id]
            return {"message": "deleted"}
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/sessions/{session_id}/download-xml")
def session_download_xml(session_id: str):
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="payment_required")
        
    if session["status"] != "complete":
        raise HTTPException(status_code=400, detail="Session not complete")
        
    income_data = session.get("income_data")
    if not income_data:
        raise HTTPException(status_code=400, detail="No income data")
        
    tax_result = compare_regimes(income_data)
    has_capital_gains = income_data.get("has_capital_gains", False)
    taxpayer = {"name": "User"}
    
    regime = tax_result["recommended_regime"]
    if regime == "old":
        chosen_tax_result = tax_result["old_regime"]
    else:
        chosen_tax_result = tax_result["new_regime"]
        
    if has_capital_gains:
        xml = generate_itr2_xml(taxpayer, income_data, chosen_tax_result, cg_result=None)
        errors = validate_xml(xml, "ITR2")
    else:
        xml = generate_itr1_xml(taxpayer, income_data, chosen_tax_result)
        errors = validate_xml(xml, "ITR1")
        
    return {"xml": xml, "validation_errors": errors}

@app.post("/sessions/{session_id}/generate-xml")
def session_generate_xml(session_id: str, req: GenerateXmlRequest):
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="payment_required")
        
    if session["status"] != "complete":
        raise HTTPException(status_code=400, detail="Session not complete")
        
    income_data = session["income_data"]
    tax_result = compare_regimes(income_data)
    
    has_capital_gains = income_data.get("has_capital_gains", False)
    
    regime = req.taxpayer.get("regime", tax_result["recommended_regime"])
    if regime == "old":
        chosen_tax_result = tax_result["old_regime"]
    else:
        chosen_tax_result = tax_result["new_regime"]
        
    if has_capital_gains:
        xml = generate_itr2_xml(req.taxpayer, income_data, chosen_tax_result, cg_result=None)
        errors = validate_xml(xml, "ITR2")
    else:
        xml = generate_itr1_xml(req.taxpayer, income_data, chosen_tax_result)
        errors = validate_xml(xml, "ITR1")
        
    return {"xml": xml, "validation_errors": errors}

@app.post("/sessions/{session_id}/upload-form16")
async def session_upload_form16(session_id: str, file: UploadFile = File(...)):
    try:
        session = get_session(session_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
        
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    pdf_bytes = await file.read()
    
    try:
        parsed = parse_form16(pdf_bytes)
    except LowConfidenceError as e:
        raise HTTPException(status_code=422, detail={"error": "low_confidence", "partial_data": e.partial_data})
        
    income_data = map_to_income_data(parsed)
    
    current_income_data = session.get("income_data") or {}
    for k, v in income_data.items():
        if k == "prefilled_fields":
            existing_prefilled = current_income_data.get("prefilled_fields", [])
            current_income_data["prefilled_fields"] = list(set(existing_prefilled + v))
        else:
            current_income_data[k] = v
            
    save_session(session_id, {
        "income_data": current_income_data
    })
    
    return {
        "parsed": parsed,
        "income_data": current_income_data,
        "prefilled_fields": current_income_data.get("prefilled_fields", [])
    }