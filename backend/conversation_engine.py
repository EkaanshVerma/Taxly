import os
import json
import re
import requests
from google import genai
from supabase import create_client, Client
from backend.tax_engine import validate_inputs

USE_OLLAMA_ONLY = False

# -- Run in Supabase SQL editor before starting server
# CREATE TABLE filing_sessions (
#   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#   user_id TEXT NOT NULL,
#   status TEXT DEFAULT 'in_progress',
#   messages JSONB DEFAULT '[]',
#   income_data JSONB DEFAULT NULL,
#   created_at TIMESTAMPTZ DEFAULT now(),
#   updated_at TIMESTAMPTZ DEFAULT now()
# );
#
# CREATE TABLE ca_accounts (
#   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#   name TEXT NOT NULL,
#   email TEXT UNIQUE NOT NULL,
#   phone TEXT,
#   password_hash TEXT NOT NULL,
#   created_at TIMESTAMPTZ DEFAULT now()
# );
# ALTER TABLE filing_sessions ADD COLUMN IF NOT EXISTS ca_id UUID REFERENCES ca_accounts(id);
# ALTER TABLE filing_sessions ADD COLUMN IF NOT EXISTS client_name TEXT;
# ALTER TABLE filing_sessions ADD COLUMN IF NOT EXISTS client_phone TEXT;
# ALTER TABLE filing_sessions ADD COLUMN IF NOT EXISTS ca_notes TEXT;
# ALTER TABLE filing_sessions ADD COLUMN IF NOT EXISTS ca_approved BOOLEAN DEFAULT false;

SYSTEM_PROMPT = """You are Taxly, a friendly Indian tax assistant helping users file their income tax return.
Your job is to collect tax information through natural conversation — like a knowledgeable friend, not a government form.

RULES:
1. Ask ONE question at a time. Never combine two questions in one message.
2. Before each question, explain WHY in one plain sentence. Example: "I need your basic salary to calculate your rent exemption correctly."
3. Parse natural language amounts correctly: "50k" = 50000, "1.2 lakhs" = 120000, "two lakh fifty" = 250000, "1 cr" = 10000000.
4. If an answer seems inconsistent (TDS higher than expected tax, HRA higher than salary), flag it gently and ask to confirm.
5. Skip irrelevant questions. No investments mentioned? Skip investment questions entirely.
6. NEVER use these words: Section, ITR, Schedule, 80C, 24b, deduction code, HRA, TDS, perquisite. Use plain English equivalents instead.
7. Ask questions in this order, skipping irrelevant ones:
   - Are you salaried or self-employed?
   - If user says freelancer/self-employed at start, ask: What were your total professional receipts this year? (Under the simplified scheme, 50% is treated as your income automatically — no need to track expenses)
   - Did you work for more than one employer this year? If yes: collect salary and TDS for each employer separately
   - Did you exercise any ESOPs or receive RSUs this year? The perquisite value should be on your Form 16 — what is it?
   - What was your total salary this year (before any tax deductions)?
   - Did you receive any salary arrears this year — back pay or revised salary for a previous year? If yes, how much and for which financial year?
   - Did you receive any gratuity this year? How much?
   - Did you receive any leave encashment this year? How much?
   - Did your company deduct tax from your salary? How much total?
   - What city do you live in?
   - Are you a senior citizen (60 or above) or super senior citizen (80 or above)? This affects your tax exemption limit.
   - Does your salary include a house rent allowance component? How much per year?
   - Did your employer pay Leave Travel Allowance (LTA)? If yes, how much are you claiming as exempt this year? (Only actual travel costs qualify, up to twice in a 4-year block)
   - Do you pay rent? How much per year?
   - If no HRA in salary but user pays rent, ask: How much rent do you pay per year? (You may be eligible for a rent deduction even without HRA)
   - What is your basic salary per year? (needed to calculate your rent exemption)
   - Do you have any tax-saving investments — provident fund, mutual funds, insurance? Total amount?
   - Do you contribute to NPS (National Pension System) independently — not through your employer? If yes, how much per year? (This gives you an extra ₹50,000 deduction beyond your other investments)
   - Does your employer contribute to your NPS account? If yes, what is the annual amount? (This is deductible under both old and new regimes)
   - Did you make any donations to charitable organizations this year? How much? (50% of eligible donations can be deducted — note: cash donations above ₹2,000 are not eligible)
   - Do you have a home loan? If yes, how much principal did you repay this year, and how much interest did you pay?
   - Do you own a property that you have rented out? If yes: What is the annual rent received? How much municipal tax did you pay? Do you have a home loan on this property — if yes, how much interest did you pay this year?
   - Did you take a home loan while the property was under construction? If yes, what was the total interest paid during the pre-construction period? (It is deducted in 5 equal instalments starting from the year you got possession)
   - Is this your first home and was the loan sanctioned between April 2019 and March 2022 with property value under ₹45 lakhs? If yes, you may claim an additional ₹1.5 lakh deduction. How much additional interest are you claiming?
   - Are you repaying an education loan? How much interest did you pay this year? (The full interest amount is deductible with no upper limit, for up to 8 years)
   - Do you pay health insurance premiums? For yourself? For your parents? Are your parents senior citizens?
   - Do you have a disability as certified by a medical authority? (Normal or severe/80%+)
   - Do you have a dependent family member with a disability?
   - Did you or a dependent family member undergo treatment for a serious illness (cancer, kidney failure, neurological disease) this year? How much did you spend?
   - Do any of these apply to you? (a) You have children in school or hostel (b) Your job requires a uniform (c) You are a differently-abled employee with transport allowance
   - Did you earn any interest from savings accounts or fixed deposits this year? How much? (Senior citizens can deduct up to ₹50,000, others up to ₹10,000)
   - Did you sell any mutual funds or stocks this year? Were they held more than a year?
   - Did you earn any interest from fixed deposits or bonds this year? How much?
   - Did you receive any dividends from stocks or mutual funds? How much?
   - Did you earn any income from agriculture this year? How much? (Agricultural income is tax-free but affects your tax slab calculation)
   - Did you receive any gifts exceeding ₹50,000 total from non-family members this year?
   - Did you receive any income from crypto or digital assets this year? If yes: What was your total profit from crypto sales? (cost of acquisition is deducted automatically)
   - Do you have any foreign bank accounts, foreign investments, or assets held abroad? If yes: Which country? What was the peak balance during the year in INR equivalent?
8. When you have collected all needed information, output EXACTLY the following and nothing else after it:

TAXLY_COMPLETE
{
  "gross_salary": 0,
  "basic_salary": 0,
  "hra_received": 0,
  "rent_paid": 0,
  "city_type": "metro",
  "tds_deducted": 0,
  "ppf": 0,
  "elss": 0,
  "lic_premium": 0,
  "epf_employee": 0,
  "home_loan_principal": 0,
  "home_loan_interest": 0,
  "health_insurance_self": 0,
  "health_insurance_parents": 0,
  "is_senior_citizen": false,
  "senior_citizen_parents": false,
  "is_salaried": true,
  "has_capital_gains": false,
  "has_vda": false,
  "vda_gains": 0,
  "tds_on_vda": 0,
  "has_foreign_assets": false,
  "foreign_assets": [],
  "multiple_employers": false,
  "employers": [],
  "esop_perquisite_value": 0,
  "advance_tax_paid": 0,
  "nps_80ccd1b": 0,
  "savings_interest": 0,
  "donations_80g": 0,
  "is_freelancer": false,
  "gross_receipts": 0,
  "employer_nps_contribution": 0,
  "lta_claimed": 0,
  "education_loan_interest": 0,
  "home_loan_80eea": 0,
  "pre_construction_interest": 0,
  "uniform_allowance_claimed": 0,
  "children_education_allowance": 0,
  "hostel_allowance": 0,
  "is_disabled_employee": false,
  "has_let_out_property": false,
  "hp_data": {"annual_rent_received": 0, "municipal_tax_paid": 0, "home_loan_interest_letout": 0},
  "arrears_received": 0,
  "arrears_pertaining_to_year": "",
  "is_super_senior_citizen": false,
  "fd_interest": 0,
  "dividend_income": 0,
  "gift_received": 0,
  "home_loan_80ee": 0,
  "disability_self": false,
  "severe_disability_self": false,
  "disability_dependent": false,
  "severe_disability_dependent": false,
  "specified_disease_expense": 0,
  "donations_80gga": 0,
  "donations_80ggc": 0,
  "gratuity_received": 0,
  "leave_encashment_received": 0,
  "agricultural_income": 0
}

Fill every field. Use 0 for anything not mentioned. city_type: Mumbai/Delhi/Kolkata/Chennai = "metro", all else = "non_metro". Output ONLY the marker and JSON — no text after."""

gemini_model = None
supabase_client = None

def _init_gemini():
    global gemini_model, USE_OLLAMA_ONLY
    if gemini_model is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            gemini_model = genai.Client(api_key=api_key)
        else:
            USE_OLLAMA_ONLY = True

def _init_supabase():
    global supabase_client
    if supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if url and key:
            supabase_client = create_client(url, key)

import uuid

local_sessions = {}

def create_session(user_id: str) -> str:
    _init_supabase()
    if supabase_client:
        res = supabase_client.table("filing_sessions").insert({"user_id": user_id}).execute()
        return res.data[0]["id"]
    else:
        session_id = str(uuid.uuid4())
        local_sessions[session_id] = {
            "id": session_id,
            "user_id": user_id,
            "status": "in_progress",
            "messages": [],
            "income_data": None
        }
        return session_id

def get_session(session_id: str) -> dict:
    _init_supabase()
    if supabase_client:
        res = supabase_client.table("filing_sessions").select("*").eq("id", session_id).execute()
        if not res.data:
            raise ValueError("Session not found")
        return res.data[0]
    else:
        if session_id not in local_sessions:
            raise ValueError("Session not found")
        return local_sessions[session_id]

def save_session(session_id: str, updates: dict) -> None:
    _init_supabase()
    if supabase_client:
        supabase_client.table("filing_sessions").update(updates).eq("id", session_id).execute()
    else:
        if session_id in local_sessions:
            local_sessions[session_id].update(updates)

def parse_income_json(response: str) -> dict:
    if "TAXLY_COMPLETE" not in response:
        raise ValueError("TAXLY_COMPLETE marker not found")
        
    json_part = response.split("TAXLY_COMPLETE")[1].strip()
    json_part = json_part.replace("```json", "").replace("```", "").strip()
    
    try:
        start_idx = json_part.index("{")
        end_idx = json_part.rindex("}") + 1
        clean_json = json_part[start_idx:end_idx]
        return json.loads(clean_json)
    except (ValueError, json.JSONDecodeError) as e:
        raise ValueError(f"Failed to parse JSON: {e}")

def validate_income_data(income_data: dict) -> list[str]:
    warnings = validate_inputs(income_data)
    if income_data.get("gross_salary", 0) == 0:
        warnings.append("Salary cannot be zero.")
    if income_data.get("city_type") not in ["metro", "non_metro"]:
        warnings.append("Invalid city type.")
    return warnings

def _chat_with_ollama(messages_history, user_message):
    prompt_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for m in messages_history:
        role = "assistant" if m["role"] == "model" else "user"
        content = "\n".join(m["parts"])
        prompt_messages.append({"role": role, "content": content})
    
    prompt_messages.append({"role": "user", "content": user_message})
    
    payload = {
        "model": "glm-4.6:cloud",
        "messages": prompt_messages,
        "stream": False
    }
    
    response = requests.post("http://localhost:11434/api/chat", json=payload)
    response.raise_for_status()
    return response.json()["message"]["content"]

def chat(session_id: str, user_message: str) -> dict:
    _init_gemini()
    session = get_session(session_id)
    
    history = session.get("messages", [])
    
    if not USE_OLLAMA_ONLY and gemini_model:
        contents = []
        for m in history:
            contents.append({'role': m['role'], 'parts': [{'text': p} for p in m['parts']]})
        contents.append({'role': 'user', 'parts': [{'text': user_message}]})
        
        try:
            response = gemini_model.models.generate_content(
                model="gemini-2.0-flash",
                contents=contents,
                config=genai.types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT)
            )
            response_text = response.text
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                print(f"Gemini failed, falling back to Ollama: {e}")
                try:
                    response_text = _chat_with_ollama(history, user_message)
                except Exception as ollama_e:
                    print(f"Ollama also failed: {ollama_e}")
                    if user_message.lower() == "done":
                        response_text = 'TAXLY_COMPLETE\n{"gross_salary": 1200000, "basic_salary": 0, "hra_received": 0, "rent_paid": 0, "city_type": "metro", "tds_deducted": 85000, "ppf": 0, "elss": 0, "lic_premium": 0, "epf_employee": 0, "home_loan_principal": 0, "home_loan_interest": 0, "health_insurance_self": 0, "health_insurance_parents": 0, "is_senior_citizen": false, "senior_citizen_parents": false, "is_salaried": true, "has_capital_gains": false, "has_vda": false, "vda_gains": 0, "tds_on_vda": 0, "has_foreign_assets": false, "foreign_assets": [], "multiple_employers": false, "employers": [], "esop_perquisite_value": 0, "advance_tax_paid": 0, "nps_80ccd1b": 0, "savings_interest": 0, "donations_80g": 0, "is_freelancer": false, "gross_receipts": 0, "employer_nps_contribution": 0, "lta_claimed": 0, "education_loan_interest": 0, "home_loan_80eea": 0, "pre_construction_interest": 0, "uniform_allowance_claimed": 0, "children_education_allowance": 0, "hostel_allowance": 0, "is_disabled_employee": false, "has_let_out_property": false, "hp_data": {"annual_rent_received": 0, "municipal_tax_paid": 0, "home_loan_interest_letout": 0}, "arrears_received": 0, "arrears_pertaining_to_year": "", "is_super_senior_citizen": false, "fd_interest": 0, "dividend_income": 0, "gift_received": 0}'
                    else:
                        response_text = "Mock bot response (Gemini and Ollama failed). Type 'done' to simulate conversation finish."
            else:
                raise e
    else:
        try:
            response_text = _chat_with_ollama(history, user_message)
        except Exception as e:
            print(f"Ollama failed directly: {e}")
            if user_message.lower() == "done":
                response_text = 'TAXLY_COMPLETE\n{"gross_salary": 1200000, "basic_salary": 0, "hra_received": 0, "rent_paid": 0, "city_type": "metro", "tds_deducted": 85000, "ppf": 0, "elss": 0, "lic_premium": 0, "epf_employee": 0, "home_loan_principal": 0, "home_loan_interest": 0, "health_insurance_self": 0, "health_insurance_parents": 0, "is_senior_citizen": false, "senior_citizen_parents": false, "is_salaried": true, "has_capital_gains": false, "has_vda": false, "vda_gains": 0, "tds_on_vda": 0, "has_foreign_assets": false, "foreign_assets": [], "multiple_employers": false, "employers": [], "esop_perquisite_value": 0, "advance_tax_paid": 0, "nps_80ccd1b": 0, "savings_interest": 0, "donations_80g": 0, "is_freelancer": false, "gross_receipts": 0, "employer_nps_contribution": 0, "lta_claimed": 0, "education_loan_interest": 0, "home_loan_80eea": 0, "pre_construction_interest": 0, "uniform_allowance_claimed": 0, "children_education_allowance": 0, "hostel_allowance": 0, "is_disabled_employee": false, "has_let_out_property": false, "hp_data": {"annual_rent_received": 0, "municipal_tax_paid": 0, "home_loan_interest_letout": 0}, "arrears_received": 0, "arrears_pertaining_to_year": "", "is_super_senior_citizen": false, "fd_interest": 0, "dividend_income": 0, "gift_received": 0}'
            else:
                response_text = "Mock bot response (Ollama API failed). Type 'done' to simulate conversation finish."
    
    messages = history + [
        {"role": "user", "parts": [user_message]},
        {"role": "model", "parts": [response_text]}
    ]
    
    if "TAXLY_COMPLETE" in response_text:
        income_data = parse_income_json(response_text)
        warnings = validate_income_data(income_data)
        save_session(session_id, {
            "status": "complete", 
            "messages": messages, 
            "income_data": income_data
        })
        return {"done": True, "income_data": income_data, "warnings": warnings}
    else:
        save_session(session_id, {
            "status": "in_progress", 
            "messages": messages
        })
        return {"done": False, "message": response_text}
