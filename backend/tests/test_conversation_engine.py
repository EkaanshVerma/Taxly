import json
import pytest
from unittest.mock import patch, MagicMock
from backend.conversation_engine import parse_income_json, validate_income_data, chat

COMPLETE_JSON = '{"gross_salary":800000,"basic_salary":400000,"hra_received":120000,"rent_paid":96000,"city_type":"metro","tds_deducted":50000,"ppf":50000,"elss":0,"lic_premium":0,"epf_employee":0,"home_loan_principal":0,"home_loan_interest":0,"health_insurance_self":0,"health_insurance_parents":0,"is_senior_citizen":false,"senior_citizen_parents":false,"is_salaried":true,"has_capital_gains":false}'

def test_parse_income_json_valid():
    result = parse_income_json(f"TAXLY_COMPLETE\n{COMPLETE_JSON}")
    assert result["gross_salary"] == 800000
    assert result["city_type"] == "metro"

def test_parse_income_json_malformed():
    with pytest.raises(ValueError):
        parse_income_json("TAXLY_COMPLETE\n{broken json{{")

def test_parse_income_json_no_marker():
    with pytest.raises(ValueError):
        parse_income_json('{"gross_salary": 800000}')

def test_validate_zero_salary():
    data = {**json.loads(COMPLETE_JSON), "gross_salary": 0}
    warnings = validate_income_data(data)
    assert any("salary" in w.lower() for w in warnings)

@patch("backend.conversation_engine.gemini_model")
@patch("backend.conversation_engine.get_session")
@patch("backend.conversation_engine.save_session")
def test_chat_question(mock_save, mock_get, mock_model):
    mock_get.return_value = {"messages": [], "status": "in_progress", "income_data": None}
    mock_model.models.generate_content.return_value = MagicMock(text="What is your total salary this year?")
    result = chat("fake-id", "I am salaried")
    assert result["done"] == False
    assert "message" in result

@patch("backend.conversation_engine.gemini_model")
@patch("backend.conversation_engine.get_session")
@patch("backend.conversation_engine.save_session")
def test_chat_complete(mock_save, mock_get, mock_model):
    mock_get.return_value = {"messages": [], "status": "in_progress", "income_data": None}
    mock_model.models.generate_content.return_value = MagicMock(text=f"TAXLY_COMPLETE\n{COMPLETE_JSON}")
    result = chat("fake-id", "done")
    assert result["done"] == True
    assert result["income_data"]["gross_salary"] == 800000

def test_validate_invalid_city():
    data = {**json.loads(COMPLETE_JSON), "city_type": "bangalore"}
    warnings = validate_income_data(data)
    assert any("city" in w.lower() for w in warnings)

def test_parse_ignores_preamble():
    result = parse_income_json(f"Great! I have all I need.\nTAXLY_COMPLETE\n{COMPLETE_JSON}")
    assert result["is_salaried"] == True
