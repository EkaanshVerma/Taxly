import pytest
from unittest.mock import patch, MagicMock
from backend.form16_parser import (
    parse_form16, detect_form16_type, extract_fields,
    compute_confidence, map_to_income_data,
    _clean_amount, LowConfidenceError
)

SAMPLE_FORM16_TEXT = """
FORM NO. 16
Certificate under section 203 of the Income-tax Act, 1961
Assessment Year: 2025-26
Name of Employee: RAHUL SHARMA
PAN of Employee: ABCDE1234F
Name of Employer: INFOSYS LIMITED
TAN of Employer: BLRI12345A

PART B
Gross Salary                                    12,00,000
(a) Salary as per provisions                    12,00,000
Less: Allowances exempt under section 10        56,000
Balance (Gross Total Salary)                    11,44,000
Less: Standard Deduction                        50,000
Net Salary                                      10,94,000

Deductions under Chapter VI-A
Under Section 80C                               1,50,000
Under Section 80D                               20,000

Total Income                                    9,24,000
Tax on Total Income                             1,07,000
Rebate under section 87A                        0
Health & Education Cess @ 4%                    4,280
Total Tax Payable                               1,11,280
Total Amount of Tax Deducted                    85,000
"""

def test_detect_form16_type_valid():
    result = detect_form16_type(SAMPLE_FORM16_TEXT)
    assert result == "form16"

def test_detect_form16_type_invalid():
    with pytest.raises(ValueError, match="Not a Form 16"):
        detect_form16_type("This is a random document about sales.")

def test_extract_gross_salary():
    fields = extract_fields(SAMPLE_FORM16_TEXT)
    assert fields["gross_salary"]["value"] == 1200000

def test_extract_tds():
    fields = extract_fields(SAMPLE_FORM16_TEXT)
    assert fields["tds_deducted"]["value"] == 85000

def test_extract_pan():
    fields = extract_fields(SAMPLE_FORM16_TEXT)
    assert fields["employee_pan"]["value"] == "ABCDE1234F"

def test_compute_confidence_high():
    fields = extract_fields(SAMPLE_FORM16_TEXT)
    score = compute_confidence(fields)
    assert score >= 0.6

def test_clean_amount():
    assert _clean_amount("12,00,000") == 1200000
    assert _clean_amount("85,000") == 85000
    assert _clean_amount("0") == 0
    assert _clean_amount("bad") == 0

def test_map_to_income_data():
    parsed = {
        "gross_salary": 1200000, "tds_deducted": 85000,
        "section_80c": 150000, "section_80d": 20000,
        "home_loan_interest": 0, "employee_pan": "ABCDE1234F",
        "employer_tan": "BLRI12345A", "assessment_year": "2025-26",
        "confidence": 0.9, "prefilled_fields": ["gross_salary", "tds_deducted"]
    }
    income = map_to_income_data(parsed)
    assert income["gross_salary"] == 1200000
    assert income["is_salaried"] == True
    assert income["basic_salary"] == 0
    assert "prefilled_fields" in income

def test_low_confidence_raises():
    weak_text = "FORM NO. 16\nCertificate under section 203\nSome garbled text with no amounts"
    with patch("backend.form16_parser.extract_text_from_pdf", return_value=weak_text):
        with pytest.raises(LowConfidenceError):
            parse_form16(b"fake-pdf-bytes")

def test_parse_form16_success():
    with patch("backend.form16_parser.extract_text_from_pdf", return_value=SAMPLE_FORM16_TEXT):
        result = parse_form16(b"fake-pdf-bytes")
        assert result["gross_salary"] == 1200000
        assert result["tds_deducted"] == 85000
        assert result["confidence"] >= 0.6
