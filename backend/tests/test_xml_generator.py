import pytest
from backend.tax_engine import calculate_old_regime, calculate_new_regime, calculate_capital_gains
from backend.itr_xml_generator import generate_itr1_xml, generate_itr2_xml, validate_xml, _format_date, _state_code

TAXPAYER = {
  "pan": "TESTX1234Y",
  "name": "TEST USER",
  "dob": "1988-03-20",
  "mobile": "9000000000",
  "email": "test@example.com",
  "address": "1 Test Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "assessment_year": "2025-26",
  "employer_name": "Test Corp Ltd",
  "employer_tan": "MUMX99999A",
  "employer_type": "private",
  "bank_account": "9876543210",
  "bank_ifsc": "HDFC0001234",
  "bank_name": "HDFC Bank",
  "regime": "new"
}

INCOME = {
  "gross_salary": 1200000, "basic_salary": 600000,
  "hra_received": 180000, "rent_paid": 144000,
  "city_type": "metro", "tds_deducted": 85000,
  "ppf": 50000, "elss": 50000, "lic_premium": 0,
  "epf_employee": 30000, "home_loan_principal": 50000,
  "home_loan_interest": 150000, "health_insurance_self": 20000,
  "health_insurance_parents": 0, "is_senior_citizen": False,
  "senior_citizen_parents": False, "is_salaried": True
}

def test_itr1_generates_and_validates():
    tax = calculate_new_regime(INCOME)
    xml = generate_itr1_xml(TAXPAYER, INCOME, tax)
    errors = validate_xml(xml, "ITR1")
    assert errors == [], f"Validation errors: {errors}"
    assert xml.count("TESTX1234Y") == 2
    assert "<ITR1>" in xml

def test_assessment_year_format():
    tax = calculate_new_regime(INCOME)
    xml = generate_itr1_xml(TAXPAYER, INCOME, tax)
    assert "<AssessmentYear>2025-26</AssessmentYear>" in xml

def test_refund_calculation():
    tax = calculate_new_regime(INCOME)
    xml = generate_itr1_xml(TAXPAYER, INCOME, tax)
    import xml.etree.ElementTree as ET
    root = ET.fromstring(xml)
    refund = int(root.find(".//Refund").text)
    balance = int(root.find(".//BalTaxPayable").text)
    assert refund >= 0
    assert balance >= 0
    assert refund == 0 or balance == 0

def test_itr2_capital_gains_tag():
    tax = calculate_new_regime(INCOME)
    cg = calculate_capital_gains({
      "ltcg_equity": 200000, "stcg_equity": 50000,
      "ltcg_debt_pre_april23": 0, "ltcg_debt_post_april23": 0,
      "debt_purchase_fy": None, "debt_sale_fy": None,
      "cost_of_debt_acquisition": 0, "applicable_slab_rate": 0.10
    })
    xml = generate_itr2_xml(TAXPAYER, INCOME, tax, cg)
    errors = validate_xml(xml, "ITR2")
    assert errors == [], f"Validation errors: {errors}"
    assert "<TotalCGTax>" in xml
    import xml.etree.ElementTree as ET
    root = ET.fromstring(xml)
    cg_tax = int(root.find(".//TotalCGTax").text)
    assert cg_tax == cg["total_cg_tax"]

def test_foreign_assets_present_when_true():
    taxpayer = {
        "pan": "ABCDE1234F", "name": "John", "dob": "1990-01-01",
        "assessment_year": "2025", "address": "123", "city": "Mumbai",
        "state": "maharashtra", "pincode": "400001", "mobile": "999", "email": "a@b.com"
    }
    income_data = {
        "gross_salary": 1000000,
        "has_foreign_assets": True,
        "foreign_assets": [
            {"country": "USA", "account_no": "123456", "peak_balance": 50000, "closing_balance": 40000}
        ]
    }
    tax_result = {"taxable_income": 950000, "tax_before_cess": 0, "cess": 0, "total_tax": 0}
    
    xml_str = generate_itr2_xml(taxpayer, income_data, tax_result)
    assert "<ScheduleFA>" in xml_str
    assert "<CountryName>USA</CountryName>" in xml_str
    assert "<PeakBalanceDuringYear>50000</PeakBalanceDuringYear>" in xml_str

def test_foreign_assets_absent_when_false():
    taxpayer = {
        "pan": "ABCDE1234F", "name": "John", "dob": "1990-01-01",
        "assessment_year": "2025", "address": "123", "city": "Mumbai",
        "state": "maharashtra", "pincode": "400001", "mobile": "999", "email": "a@b.com"
    }
    income_data = {
        "gross_salary": 1000000,
        "has_foreign_assets": False,
        "foreign_assets": []
    }
    tax_result = {"taxable_income": 950000, "tax_before_cess": 0, "cess": 0, "total_tax": 0}
    
    xml_str = generate_itr2_xml(taxpayer, income_data, tax_result)
    assert "<ScheduleFA>" not in xml_str

def test_state_code_mapping():
    assert _state_code("Karnataka") == "KA"
    assert _state_code("Maharashtra") == "MH"
    assert _state_code("Goa") == "OTH"

def test_date_format():
    assert _format_date("1990-05-15") == "15/05/1990"
    assert _format_date("2025-07-31") == "31/07/2025"

def test_regime_flag():
    tax_new = calculate_new_regime(INCOME)
    xml_new = generate_itr1_xml({**TAXPAYER, "regime": "new"}, INCOME, tax_new)
    assert "<RegimeOptedOld>N</RegimeOptedOld>" in xml_new

    tax_old = calculate_old_regime(INCOME)
    xml_old = generate_itr1_xml({**TAXPAYER, "regime": "old"}, INCOME, tax_old)
    assert "<RegimeOptedOld>Y</RegimeOptedOld>" in xml_old

def test_schedule_hp_always_present_in_itr2():
    income_no_loan = {**INCOME, "home_loan_interest": 0}
    tax = calculate_new_regime(income_no_loan)
    xml = generate_itr2_xml(TAXPAYER, income_no_loan, tax, None)
    assert "<ScheduleHP>" in xml
    assert "<TotalIncomeChargeableUnderHP>0</TotalIncomeChargeableUnderHP>" in xml
