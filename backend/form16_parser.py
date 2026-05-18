import fitz
import re

class LowConfidenceError(Exception):
    def __init__(self, message: str, partial_data: dict):
        super().__init__(message)
        self.partial_data = partial_data

GROSS_SALARY_PATTERNS = [
    r"[Gg]ross\s+[Ss]alary[^\d]{0,60}?([\d,]+)",
    r"(?:a\))\s*(?:Salary|salary)[^\d]{0,60}?([\d,]+)",
]

TDS_PATTERNS = [
    r"[Tt]otal\s+(?:[Aa]mount\s+of\s+)?[Tt]ax\s+[Dd]educted[^\d]{0,60}?([\d,]+)",
    r"[Tt]ax\s+[Dd]educted\s+at\s+[Ss]ource[^\d]{0,60}?([\d,]+)",
]

PAN_PATTERN = r"\b([A-Z]{5}[0-9]{4}[A-Z])\b"
TAN_PATTERN = r"\b([A-Z]{4}[0-9]{5}[A-Z])\b"
AY_PATTERN = r"(?:Assessment\s+Year|A\.Y\.?)[\s:]+(\d{4}-\d{2,4}|\d{4}-\d{2})"
DEDUCTION_80C_PATTERN = r"(?:80C|deduction\s+under\s+80C)[^\d]{0,60}?([\d,]+)"
DEDUCTION_80D_PATTERN = r"(?:80D|[Hh]ealth\s+[Ii]nsurance)[^\d]{0,60}?([\d,]+)"
HOME_LOAN_PATTERN = r"(?:24\(b\)|[Hh]ouse\s+[Pp]roperty|[Hh]ome\s+[Ll]oan\s+[Ii]nterest)[^\d]{0,60}?([\d,]+)"

def _clean_amount(raw: str) -> int:
    try:
        if '.' in raw:
            raw = raw.split('.')[0]
        digits = re.sub(r'[^\d]', '', raw)
        return int(digits) if digits else 0
    except Exception:
        return 0

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text

def detect_form16_type(text: str) -> str:
    markers = ["FORM NO. 16", "Form No.16", "Certificate under section 203", "TDS CERTIFICATE", "PART A", "PART B"]
    for marker in markers:
        if marker.lower() in text.lower():
            return "form16"
    raise ValueError("Not a Form 16 document")

def extract_fields(text: str) -> dict:
    fields = {}
    
    gross_val = 0
    gross_conf = "low"
    for pat in GROSS_SALARY_PATTERNS:
        match = re.search(pat, text)
        if match:
            gross_val = _clean_amount(match.group(1))
            gross_conf = "high"
            break
    fields["gross_salary"] = {"value": gross_val, "confidence": gross_conf}
    
    tds_val = 0
    tds_conf = "low"
    for pat in TDS_PATTERNS:
        match = re.search(pat, text)
        if match:
            tds_val = _clean_amount(match.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds_val, "confidence": tds_conf}
    
    emp_pan = ""
    emp_pan_conf = "low"
    emp_idx = text.lower().find("employee")
    if emp_idx != -1:
        match = re.search(PAN_PATTERN, text[emp_idx:])
        if match:
            emp_pan = match.group(1)
            emp_pan_conf = "high"
    else:
        match = re.search(PAN_PATTERN, text)
        if match:
            emp_pan = match.group(1)
            emp_pan_conf = "high"
    fields["employee_pan"] = {"value": emp_pan, "confidence": emp_pan_conf}
    
    tan = ""
    tan_conf = "low"
    match = re.search(TAN_PATTERN, text)
    if match:
        tan = match.group(1)
        tan_conf = "high"
    fields["employer_tan"] = {"value": tan, "confidence": tan_conf}
    
    ay = ""
    ay_conf = "low"
    match = re.search(AY_PATTERN, text)
    if match:
        ay = match.group(1)
        ay_conf = "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    val_80c = 0
    match = re.search(DEDUCTION_80C_PATTERN, text)
    if match:
        val_80c = _clean_amount(match.group(1))
    fields["section_80c"] = {"value": val_80c, "confidence": "high" if val_80c else "low"}
    
    val_80d = 0
    match = re.search(DEDUCTION_80D_PATTERN, text)
    if match:
        val_80d = _clean_amount(match.group(1))
    fields["section_80d"] = {"value": val_80d, "confidence": "high" if val_80d else "low"}
    
    hl = 0
    match = re.search(HOME_LOAN_PATTERN, text)
    if match:
        hl = _clean_amount(match.group(1))
    fields["home_loan_interest"] = {"value": hl, "confidence": "high" if hl else "low"}
    
    emp_name = "UNKNOWN"
    name_match = re.search(r"Name\s+of\s+Employee[\s:]+([A-Z\s]+)", text, re.IGNORECASE)
    if name_match:
        emp_name = name_match.group(1).strip()
    fields["employee_name"] = {"value": emp_name, "confidence": "high" if name_match else "low"}
    
    empr_name = "UNKNOWN"
    name_match = re.search(r"Name\s+of\s+Employer[\s:]+([A-Z\s]+)", text, re.IGNORECASE)
    if name_match:
        empr_name = name_match.group(1).strip()
    fields["employer_name"] = {"value": empr_name, "confidence": "high" if name_match else "low"}
    
    return fields

def compute_confidence(extracted: dict) -> float:
    score = 0.0
    base_fields = ["tds_deducted", "employee_pan", "employer_tan", "assessment_year"]
    for field in base_fields:
        if extracted.get(field, {}).get("confidence") == "high":
            score += 0.2
    if extracted.get("gross_salary", {}).get("confidence") == "high":
        score += 0.5
    return min(score, 1.0)

def parse_form16(pdf_bytes: bytes) -> dict:
    text = extract_text_from_pdf(pdf_bytes)
    detect_form16_type(text)
    fields = extract_fields(text)
    conf = compute_confidence(fields)
    
    out = {
        "employee_name": fields.get("employee_name", {}).get("value", ""),
        "employee_pan": fields.get("employee_pan", {}).get("value", ""),
        "employer_name": fields.get("employer_name", {}).get("value", ""),
        "employer_tan": fields.get("employer_tan", {}).get("value", ""),
        "assessment_year": fields.get("assessment_year", {}).get("value", ""),
        "gross_salary": fields.get("gross_salary", {}).get("value", 0),
        "tds_deducted": fields.get("tds_deducted", {}).get("value", 0),
        "section_80c": fields.get("section_80c", {}).get("value", 0),
        "section_80d": fields.get("section_80d", {}).get("value", 0),
        "home_loan_interest": fields.get("home_loan_interest", {}).get("value", 0),
        "confidence": conf,
        "prefilled_fields": [k for k, v in fields.items() if v.get("confidence") == "high"]
    }
    
    if conf < 0.6:
        raise LowConfidenceError("Form 16 data extraction confidence is too low.", out)
        
    return out

def map_to_income_data(parsed: dict) -> dict:
    prefilled = ["gross_salary", "tds_deducted", "ppf", "health_insurance_self", "home_loan_interest", "is_salaried"]
    actual_prefilled = [f for f in prefilled if f in parsed.get("prefilled_fields", []) or f == "is_salaried"]
    
    if "section_80c" in parsed.get("prefilled_fields", []):
        if "ppf" not in actual_prefilled:
            actual_prefilled.append("ppf")
        
    if "section_80d" in parsed.get("prefilled_fields", []):
        if "health_insurance_self" not in actual_prefilled:
            actual_prefilled.append("health_insurance_self")
            
    if "home_loan_interest" in parsed.get("prefilled_fields", []) and "home_loan_interest" not in actual_prefilled:
        actual_prefilled.append("home_loan_interest")
    
    return {
        "gross_salary": parsed.get("gross_salary", 0),
        "tds_deducted": parsed.get("tds_deducted", 0),
        "ppf": parsed.get("section_80c", 0),
        "health_insurance_self": parsed.get("section_80d", 0),
        "home_loan_interest": parsed.get("home_loan_interest", 0),
        "is_salaried": True,
        
        "basic_salary": 0,
        "hra_received": 0,
        "rent_paid": 0,
        "city_type": "metro",
        "elss": 0,
        "lic_premium": 0,
        "epf_employee": 0,
        "home_loan_principal": 0,
        "health_insurance_parents": 0,
        "is_senior_citizen": False,
        "senior_citizen_parents": False,
        "has_capital_gains": False,
        
        "prefilled_fields": list(set(actual_prefilled))
    }
