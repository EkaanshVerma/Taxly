"""
Universal TDS Certificate Parser
Handles Form 16 (salary), 16A (non-salary), 16B (property), 16C (rent), 16D (contractor)
Also handles 2026 renumbered forms: Form 130, 131, 132
"""

import fitz
import re

class LowConfidenceError(Exception):
    def __init__(self, message: str, partial_data: dict):
        super().__init__(message)
        self.partial_data = partial_data


# ── Shared utilities ──────────────────────────────────────────────

def _clean_amount(raw: str) -> int:
    try:
        if '.' in raw:
            raw = raw.split('.')[0]
        digits = re.sub(r'[^\d]', '', raw)
        return int(digits) if digits else 0
    except Exception:
        return 0

PAN_PATTERN = r"\b([A-Z]{5}[0-9]{4}[A-Z])\b"
TAN_PATTERN = r"\b([A-Z]{4}[0-9]{5}[A-Z])\b"
AY_PATTERN  = r"(?:Assessment\s+Year|A\.Y\.?)[\s:]+(20\d{2}-\d{2,4})"


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text


# ── Form type detection ───────────────────────────────────────────

FORM_SIGNATURES = {
    "form16": [
        r"FORM\s*NO\.?\s*16\b",
        r"Form\s*No\.?\s*16\b",
        r"Certificate\s+under\s+section\s+203",
        r"PART\s*A.*PART\s*B",
        r"Form\s*130\b",  # 2026 renumbering
    ],
    "form16a": [
        r"FORM\s*NO\.?\s*16\s*A\b",
        r"Form\s*No\.?\s*16\s*A\b",
        r"Certificate\s+under\s+section\s+203.*other\s+than\s+salary",
        r"TDS\s+on\s+income\s+other\s+than\s+salary",
        r"Form\s*131\b",  # 2026 renumbering
    ],
    "form16b": [
        r"FORM\s*NO\.?\s*16\s*B\b",
        r"Form\s*No\.?\s*16\s*B\b",
        r"section\s+194[\-\s]*IA",
        r"immovable\s+property",
        r"Form\s*132.*(?:property|immovable)",
    ],
    "form16c": [
        r"FORM\s*NO\.?\s*16\s*C\b",
        r"Form\s*No\.?\s*16\s*C\b",
        r"section\s+194[\-\s]*IB",
        r"TDS\s+on\s+rent",
        r"Form\s*132.*rent",
    ],
    "form16d": [
        r"FORM\s*NO\.?\s*16\s*D\b",
        r"Form\s*No\.?\s*16\s*D\b",
        r"section\s+194[\-\s]*M",
        r"Form\s*132.*contract",
    ],
}

def detect_form_type(text: str) -> str:
    """Auto-detect the TDS certificate type from extracted PDF text."""
    text_lower = text.lower()
    
    # Check most specific forms first (16A before 16, 16B/C/D before 16A)
    for form_type in ["form16b", "form16c", "form16d", "form16a", "form16"]:
        for pattern in FORM_SIGNATURES[form_type]:
            if re.search(pattern, text, re.IGNORECASE):
                return form_type
    
    # Fallback heuristics
    if "salary" in text_lower and ("part a" in text_lower or "part b" in text_lower):
        return "form16"
    if "interest" in text_lower and "tds" in text_lower and "bank" in text_lower:
        return "form16a"
    
    raise ValueError("Could not identify TDS certificate type. Please upload a valid Form 16, 16A, 16B, 16C, or 16D.")


# ── Form 16 (Salary) Parser ──────────────────────────────────────

GROSS_SALARY_PATTERNS = [
    r"[Gg]ross\s+[Ss]alary[^\d]{0,60}?([\d,]+)",
    r"(?:a\))\s*(?:Salary|salary)[^\d]{0,60}?([\d,]+)",
]

TDS_PATTERNS = [
    r"[Tt]otal\s+(?:[Aa]mount\s+of\s+)?[Tt]ax\s+[Dd]educted[^\d]{0,60}?([\d,]+)",
    r"[Tt]ax\s+[Dd]educted\s+at\s+[Ss]ource[^\d]{0,60}?([\d,]+)",
]

DEDUCTION_80C_PATTERN = r"(?:80C|deduction\s+under\s+80C)[^\d]{0,60}?([\d,]+)"
DEDUCTION_80D_PATTERN = r"(?:80D|[Hh]ealth\s+[Ii]nsurance)[^\d]{0,60}?([\d,]+)"
HOME_LOAN_PATTERN     = r"(?:24\(b\)|[Hh]ouse\s+[Pp]roperty|[Hh]ome\s+[Ll]oan\s+[Ii]nterest)[^\d]{0,60}?([\d,]+)"

def _extract_form16_fields(text: str) -> dict:
    fields = {}
    
    # Gross salary
    gross_val, gross_conf = 0, "low"
    for pat in GROSS_SALARY_PATTERNS:
        m = re.search(pat, text)
        if m:
            gross_val = _clean_amount(m.group(1))
            gross_conf = "high"
            break
    fields["gross_salary"] = {"value": gross_val, "confidence": gross_conf}
    
    # TDS deducted
    tds_val, tds_conf = 0, "low"
    for pat in TDS_PATTERNS:
        m = re.search(pat, text)
        if m:
            tds_val = _clean_amount(m.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds_val, "confidence": tds_conf}
    
    # Employee PAN
    emp_pan, emp_pan_conf = "", "low"
    emp_idx = text.lower().find("employee")
    if emp_idx != -1:
        m = re.search(PAN_PATTERN, text[emp_idx:])
        if m:
            emp_pan, emp_pan_conf = m.group(1), "high"
    else:
        m = re.search(PAN_PATTERN, text)
        if m:
            emp_pan, emp_pan_conf = m.group(1), "high"
    fields["employee_pan"] = {"value": emp_pan, "confidence": emp_pan_conf}
    
    # Employer TAN
    tan, tan_conf = "", "low"
    m = re.search(TAN_PATTERN, text)
    if m:
        tan, tan_conf = m.group(1), "high"
    fields["employer_tan"] = {"value": tan, "confidence": tan_conf}
    
    # Assessment Year
    ay, ay_conf = "", "low"
    m = re.search(AY_PATTERN, text)
    if m:
        ay, ay_conf = m.group(1), "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    # Deductions
    for key, pat in [("section_80c", DEDUCTION_80C_PATTERN), 
                     ("section_80d", DEDUCTION_80D_PATTERN),
                     ("home_loan_interest", HOME_LOAN_PATTERN)]:
        val = 0
        m = re.search(pat, text)
        if m:
            val = _clean_amount(m.group(1))
        fields[key] = {"value": val, "confidence": "high" if val else "low"}
    
    # Names
    emp_name = "UNKNOWN"
    m = re.search(r"Name\s+of\s+Employee[\s:]+([A-Z\s]+)", text, re.IGNORECASE)
    if m:
        emp_name = m.group(1).strip()
    fields["employee_name"] = {"value": emp_name, "confidence": "high" if m else "low"}
    
    empr_name = "UNKNOWN"
    m = re.search(r"Name\s+of\s+Employer[\s:]+([A-Z\s]+)", text, re.IGNORECASE)
    if m:
        empr_name = m.group(1).strip()
    fields["employer_name"] = {"value": empr_name, "confidence": "high" if m else "low"}
    
    return fields


# ── Form 16A (Non-Salary TDS) Parser ─────────────────────────────

NATURE_OF_PAYMENT_PATTERNS = [
    r"[Nn]ature\s+of\s+[Pp]ayment[^\n]{0,80}?([\w\s/&]+)",
    r"[Ss]ection\s+under\s+which\s+(?:tax\s+)?deducted[^\n]{0,40}?(\d{3}[A-Z]*)",
]

AMOUNT_PAID_PATTERNS = [
    r"[Aa]mount\s+[Pp]aid[^\d]{0,60}?([\d,]+)",
    r"[Aa]mount\s+[Cc]redited[^\d]{0,60}?([\d,]+)",
    r"[Gg]ross\s+[Aa]mount[^\d]{0,60}?([\d,]+)",
]

TDS_16A_PATTERNS = [
    r"[Tt]ax\s+[Dd]educted[^\d]{0,60}?([\d,]+)",
    r"[Tt]otal\s+[Tt]ax\s+[Dd]educted[^\d]{0,60}?([\d,]+)",
]

def _classify_16a_income(text: str) -> str:
    """Classify what kind of non-salary income this Form 16A represents."""
    text_lower = text.lower()
    
    if any(kw in text_lower for kw in ["interest", "fixed deposit", "fd", "savings", "194a"]):
        return "interest"
    if any(kw in text_lower for kw in ["dividend", "194", "194k"]):
        return "dividend"
    if any(kw in text_lower for kw in ["professional", "194j", "technical", "consultancy"]):
        return "professional_fees"
    if any(kw in text_lower for kw in ["commission", "brokerage", "194h"]):
        return "commission"
    if any(kw in text_lower for kw in ["rent", "194i"]):
        return "rent_income"
    if any(kw in text_lower for kw in ["insurance", "194da"]):
        return "insurance"
    
    return "other"

def _extract_form16a_fields(text: str) -> dict:
    fields = {}
    
    # Payer (deductor) details
    payer_name = ""
    m = re.search(r"[Nn]ame\s+of\s+(?:the\s+)?[Dd]eductor[\s:]+([A-Za-z\s&.]+)", text)
    if m:
        payer_name = m.group(1).strip()
    fields["payer_name"] = {"value": payer_name, "confidence": "high" if payer_name else "low"}
    
    # Payer TAN
    tan, tan_conf = "", "low"
    m = re.search(TAN_PATTERN, text)
    if m:
        tan, tan_conf = m.group(1), "high"
    fields["payer_tan"] = {"value": tan, "confidence": tan_conf}
    
    # Payee PAN
    pan_matches = re.findall(PAN_PATTERN, text)
    payee_pan = pan_matches[1] if len(pan_matches) > 1 else (pan_matches[0] if pan_matches else "")
    fields["payee_pan"] = {"value": payee_pan, "confidence": "high" if payee_pan else "low"}
    
    # Amount paid/credited
    amount, amount_conf = 0, "low"
    for pat in AMOUNT_PAID_PATTERNS:
        m = re.search(pat, text)
        if m:
            amount = _clean_amount(m.group(1))
            amount_conf = "high"
            break
    fields["amount_paid"] = {"value": amount, "confidence": amount_conf}
    
    # TDS deducted
    tds, tds_conf = 0, "low"
    for pat in TDS_16A_PATTERNS:
        m = re.search(pat, text)
        if m:
            tds = _clean_amount(m.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds, "confidence": tds_conf}
    
    # Assessment Year
    ay, ay_conf = "", "low"
    m = re.search(AY_PATTERN, text)
    if m:
        ay, ay_conf = m.group(1), "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    # Income classification
    income_type = _classify_16a_income(text)
    fields["income_type"] = {"value": income_type, "confidence": "high"}
    
    return fields


# ── Form 16B (Property Sale TDS) Parser ───────────────────────────

def _extract_form16b_fields(text: str) -> dict:
    fields = {}
    
    # Buyer (deductor) PAN
    pan_matches = re.findall(PAN_PATTERN, text)
    buyer_pan = pan_matches[0] if pan_matches else ""
    seller_pan = pan_matches[1] if len(pan_matches) > 1 else ""
    fields["buyer_pan"] = {"value": buyer_pan, "confidence": "high" if buyer_pan else "low"}
    fields["seller_pan"] = {"value": seller_pan, "confidence": "high" if seller_pan else "low"}
    
    # Property value / consideration
    prop_val, prop_conf = 0, "low"
    for pat in [r"[Tt]otal\s+[Vv]alue\s+of\s+[Cc]onsideration[^\d]{0,60}?([\d,]+)",
                r"[Ss]ale\s+[Cc]onsideration[^\d]{0,60}?([\d,]+)",
                r"[Pp]roperty\s+[Vv]alue[^\d]{0,60}?([\d,]+)"]:
        m = re.search(pat, text)
        if m:
            prop_val = _clean_amount(m.group(1))
            prop_conf = "high"
            break
    fields["property_value"] = {"value": prop_val, "confidence": prop_conf}
    
    # TDS deducted (1% of sale consideration)
    tds, tds_conf = 0, "low"
    for pat in TDS_16A_PATTERNS:
        m = re.search(pat, text)
        if m:
            tds = _clean_amount(m.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds, "confidence": tds_conf}
    
    # Date of transaction
    date_val = ""
    m = re.search(r"[Dd]ate\s+of\s+(?:transfer|transaction|payment)[^\d]{0,30}?(\d{2}[/\-]\d{2}[/\-]\d{4})", text)
    if m:
        date_val = m.group(1)
    fields["transaction_date"] = {"value": date_val, "confidence": "high" if date_val else "low"}
    
    # Assessment Year
    ay, ay_conf = "", "low"
    m = re.search(AY_PATTERN, text)
    if m:
        ay, ay_conf = m.group(1), "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    return fields


# ── Form 16C (Rent TDS) Parser ────────────────────────────────────

def _extract_form16c_fields(text: str) -> dict:
    fields = {}
    
    # Tenant (deductor) and Landlord PAN
    pan_matches = re.findall(PAN_PATTERN, text)
    tenant_pan = pan_matches[0] if pan_matches else ""
    landlord_pan = pan_matches[1] if len(pan_matches) > 1 else ""
    fields["tenant_pan"] = {"value": tenant_pan, "confidence": "high" if tenant_pan else "low"}
    fields["landlord_pan"] = {"value": landlord_pan, "confidence": "high" if landlord_pan else "low"}
    
    # Rent paid
    rent, rent_conf = 0, "low"
    for pat in [r"[Rr]ent\s+[Pp]aid[^\d]{0,60}?([\d,]+)",
                r"[Aa]mount\s+[Pp]aid[^\d]{0,60}?([\d,]+)"]:
        m = re.search(pat, text)
        if m:
            rent = _clean_amount(m.group(1))
            rent_conf = "high"
            break
    fields["rent_paid"] = {"value": rent, "confidence": rent_conf}
    
    # TDS deducted (5% of rent)
    tds, tds_conf = 0, "low"
    for pat in TDS_16A_PATTERNS:
        m = re.search(pat, text)
        if m:
            tds = _clean_amount(m.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds, "confidence": tds_conf}
    
    # Assessment Year
    ay, ay_conf = "", "low"
    m = re.search(AY_PATTERN, text)
    if m:
        ay, ay_conf = m.group(1), "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    return fields


# ── Form 16D (Contractor/Professional TDS) Parser ─────────────────

def _extract_form16d_fields(text: str) -> dict:
    fields = {}
    
    # Payer and Payee PAN
    pan_matches = re.findall(PAN_PATTERN, text)
    payer_pan = pan_matches[0] if pan_matches else ""
    payee_pan = pan_matches[1] if len(pan_matches) > 1 else ""
    fields["payer_pan"] = {"value": payer_pan, "confidence": "high" if payer_pan else "low"}
    fields["payee_pan"] = {"value": payee_pan, "confidence": "high" if payee_pan else "low"}
    
    # Contract value / amount paid
    amount, amount_conf = 0, "low"
    for pat in [r"[Cc]ontract\s+[Vv]alue[^\d]{0,60}?([\d,]+)",
                r"[Aa]mount\s+[Pp]aid[^\d]{0,60}?([\d,]+)",
                r"[Aa]ggregate\s+[Pp]ayment[^\d]{0,60}?([\d,]+)"]:
        m = re.search(pat, text)
        if m:
            amount = _clean_amount(m.group(1))
            amount_conf = "high"
            break
    fields["contract_value"] = {"value": amount, "confidence": amount_conf}
    
    # TDS deducted
    tds, tds_conf = 0, "low"
    for pat in TDS_16A_PATTERNS:
        m = re.search(pat, text)
        if m:
            tds = _clean_amount(m.group(1))
            tds_conf = "high"
            break
    fields["tds_deducted"] = {"value": tds, "confidence": tds_conf}
    
    # Nature of work
    nature = ""
    m = re.search(r"[Nn]ature\s+of\s+(?:work|contract|payment)[\s:]+([A-Za-z\s/&]+)", text)
    if m:
        nature = m.group(1).strip()
    fields["nature_of_work"] = {"value": nature, "confidence": "high" if nature else "low"}
    
    # Assessment Year
    ay, ay_conf = "", "low"
    m = re.search(AY_PATTERN, text)
    if m:
        ay, ay_conf = m.group(1), "high"
    fields["assessment_year"] = {"value": ay, "confidence": ay_conf}
    
    return fields


# ── Confidence scoring ────────────────────────────────────────────

def _compute_confidence(fields: dict, form_type: str) -> float:
    if form_type == "form16":
        score = 0.0
        for f in ["tds_deducted", "employee_pan", "employer_tan", "assessment_year"]:
            if fields.get(f, {}).get("confidence") == "high":
                score += 0.125
        if fields.get("gross_salary", {}).get("confidence") == "high":
            score += 0.5
        return min(score, 1.0)
    else:
        # For 16A/B/C/D: TDS + amount + at least one PAN
        score = 0.0
        if fields.get("tds_deducted", {}).get("confidence") == "high":
            score += 0.35
        if fields.get("assessment_year", {}).get("confidence") == "high":
            score += 0.15
        # Check for any amount field
        for key in ["amount_paid", "property_value", "rent_paid", "contract_value"]:
            if fields.get(key, {}).get("confidence") == "high":
                score += 0.30
                break
        # Check for PAN
        pan_keys = ["payee_pan", "seller_pan", "landlord_pan", "payer_pan", "buyer_pan"]
        for key in pan_keys:
            if fields.get(key, {}).get("confidence") == "high":
                score += 0.20
                break
        return min(score, 1.0)


# ── Universal mapping to income_data ──────────────────────────────

def map_to_income_data(parsed: dict) -> dict:
    """Maps ANY parsed TDS certificate into the Taxly income_data schema."""
    form_type = parsed.get("form_type", "form16")
    
    if form_type == "form16":
        return _map_form16(parsed)
    elif form_type == "form16a":
        return _map_form16a(parsed)
    elif form_type == "form16b":
        return _map_form16b(parsed)
    elif form_type == "form16c":
        return _map_form16c(parsed)
    elif form_type == "form16d":
        return _map_form16d(parsed)
    else:
        return _map_form16(parsed)

def _map_form16(parsed: dict) -> dict:
    prefilled = ["gross_salary", "tds_deducted", "is_salaried"]
    if parsed.get("section_80c", 0) > 0:
        prefilled.append("ppf")
    if parsed.get("section_80d", 0) > 0:
        prefilled.append("health_insurance_self")
    if parsed.get("home_loan_interest", 0) > 0:
        prefilled.append("home_loan_interest")
    
    return {
        "gross_salary": parsed.get("gross_salary", 0),
        "tds_deducted": parsed.get("tds_deducted", 0),
        "ppf": parsed.get("section_80c", 0),
        "health_insurance_self": parsed.get("section_80d", 0),
        "home_loan_interest": parsed.get("home_loan_interest", 0),
        "is_salaried": True,
        "basic_salary": 0, "hra_received": 0, "rent_paid": 0,
        "city_type": "metro", "elss": 0, "lic_premium": 0,
        "epf_employee": 0, "home_loan_principal": 0,
        "health_insurance_parents": 0, "is_senior_citizen": False,
        "senior_citizen_parents": False, "has_capital_gains": False,
        "prefilled_fields": list(set(prefilled)),
        "source_forms": ["form16"],
    }

def _map_form16a(parsed: dict) -> dict:
    income_type = parsed.get("income_type", "other")
    data = {"prefilled_fields": [], "source_forms": ["form16a"]}
    
    if income_type == "interest":
        data["fd_interest"] = parsed.get("amount_paid", 0)
        data["prefilled_fields"].append("fd_interest")
    elif income_type == "dividend":
        data["dividend_income"] = parsed.get("amount_paid", 0)
        data["prefilled_fields"].append("dividend_income")
    elif income_type == "professional_fees":
        data["gross_receipts"] = parsed.get("amount_paid", 0)
        data["is_freelancer"] = True
        data["prefilled_fields"].extend(["gross_receipts", "is_freelancer"])
    elif income_type == "rent_income":
        data["hp_data"] = {"annual_rent_received": parsed.get("amount_paid", 0), "municipal_tax_paid": 0, "home_loan_interest_letout": 0}
        data["has_let_out_property"] = True
        data["prefilled_fields"].append("hp_data")
    
    # TDS from 16A goes to advance_tax_paid (it's not employer TDS)
    data["advance_tax_paid"] = parsed.get("tds_deducted", 0)
    if parsed.get("tds_deducted", 0) > 0:
        data["prefilled_fields"].append("advance_tax_paid")
    
    return data

def _map_form16b(parsed: dict) -> dict:
    return {
        "has_capital_gains": True,
        "ltcg_property_sale": parsed.get("property_value", 0),
        "ltcg_property_cost": 0,  # User needs to provide cost
        "advance_tax_paid": parsed.get("tds_deducted", 0),
        "prefilled_fields": ["ltcg_property_sale", "advance_tax_paid"],
        "source_forms": ["form16b"],
    }

def _map_form16c(parsed: dict) -> dict:
    return {
        "hp_data": {
            "annual_rent_received": parsed.get("rent_paid", 0),
            "municipal_tax_paid": 0,
            "home_loan_interest_letout": 0,
        },
        "has_let_out_property": True,
        "advance_tax_paid": parsed.get("tds_deducted", 0),
        "prefilled_fields": ["hp_data", "advance_tax_paid"],
        "source_forms": ["form16c"],
    }

def _map_form16d(parsed: dict) -> dict:
    return {
        "gross_receipts": parsed.get("contract_value", 0),
        "is_freelancer": True,
        "advance_tax_paid": parsed.get("tds_deducted", 0),
        "prefilled_fields": ["gross_receipts", "is_freelancer", "advance_tax_paid"],
        "source_forms": ["form16d"],
    }


# ── Main entry point ─────────────────────────────────────────────

def parse_tds_certificate(pdf_bytes: bytes) -> dict:
    """
    Universal entry point: auto-detects form type, extracts fields, 
    computes confidence, returns structured data.
    """
    text = extract_text_from_pdf(pdf_bytes)
    form_type = detect_form_type(text)
    
    extractors = {
        "form16":  _extract_form16_fields,
        "form16a": _extract_form16a_fields,
        "form16b": _extract_form16b_fields,
        "form16c": _extract_form16c_fields,
        "form16d": _extract_form16d_fields,
    }
    
    fields = extractors[form_type](text)
    confidence = _compute_confidence(fields, form_type)
    
    # Flatten to simple values
    out = {k: v["value"] for k, v in fields.items()}
    out["form_type"] = form_type
    out["confidence"] = confidence
    out["prefilled_fields"] = [k for k, v in fields.items() if v.get("confidence") == "high"]
    
    if confidence < 0.5:
        raise LowConfidenceError(
            f"{form_type.upper()} data extraction confidence too low ({confidence:.0%}).",
            out
        )
    
    return out


# ── Backward compatibility (keep old function names working) ──────

def parse_form16(pdf_bytes: bytes) -> dict:
    """Legacy wrapper — calls the universal parser but only accepts Form 16."""
    result = parse_tds_certificate(pdf_bytes)
    if result["form_type"] != "form16":
        raise ValueError(f"Expected Form 16 but detected {result['form_type']}")
    return result
