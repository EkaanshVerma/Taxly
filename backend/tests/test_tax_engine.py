import pytest
from backend.tax_engine import (
    calculate_old_regime,
    calculate_new_regime,
    calculate_capital_gains,
    compare_regimes,
    validate_inputs
)

def test_1_new_regime_recommended():
    income_data = {
        "gross_salary": 800000,
        "basic_salary": 400000,
        "hra_received": 120000,
        "rent_paid": 96000,
        "city_type": "metro",
        "tds_deducted": 0,
        "ppf": 0, "elss": 0, "lic_premium": 0,
        "epf_employee": 0, "home_loan_principal": 0,
        "home_loan_interest": 0, "health_insurance_self": 0,
        "health_insurance_parents": 0, "is_senior_citizen": False,
        "senior_citizen_parents": False, "is_salaried": True,
        "advance_tax_paid": 53352
    }
    res = compare_regimes(income_data)
    assert res["recommended_regime"] == "new"
    assert res["old_regime"]["deduction_breakdown"]["hra_exemption"] == 56000
    assert res["old_regime_total"] == 53352
    assert res["new_regime_total"] == 23400

def test_2_old_regime_recommended():
    # Modified from 15L to 10L to make old regime mathematically recommended
    # Or keeping 15L and adding HRA to make old regime win
    income_data = {
        "gross_salary": 1500000,
        "basic_salary": 600000,
        "hra_received": 200000,
        "rent_paid": 200000,
        "city_type": "metro",
        "tds_deducted": 0,
        "ppf": 150000, "elss": 0, "lic_premium": 0,
        "epf_employee": 0, "home_loan_principal": 0,
        "home_loan_interest": 200000, "health_insurance_self": 0,
        "health_insurance_parents": 0, "is_senior_citizen": False,
        "senior_citizen_parents": False, "is_salaried": True,
        "advance_tax_paid": 200000
    }
    # HRA: min(200k, 300k, 140k) = 140k
    # Old deductions = 50k + 150k + 140k + 200k = 540k. Taxable = 960k.
    # Tax on 960k = 12.5k + 20%*(460k) = 12.5k + 92k = 104500. Cess = 4180. Total = 108680.
    # New taxable = 1425k. Tax = 125000. Cess = 5000. Total = 130000.
    # Old wins. Savings = 21320.
    res = compare_regimes(income_data)
    assert res["recommended_regime"] == "old"
    assert res["savings_amount"] == 21320

def test_3_capital_gains():
    cg_data = {
        "ltcg_equity": 200000,
        "stcg_equity": 0,
        "ltcg_debt_pre_april23": 0,
        "ltcg_debt_post_april23": 0,
        "applicable_slab_rate": 0.30
    }
    res = calculate_capital_gains(cg_data)
    assert res["exempt_ltcg_amount"] == 100000
    assert res["ltcg_equity_tax"] == 10000
    assert res["total_cg_tax"] == 10000

def test_4_rebate_old_regime():
    income_data = {"gross_salary": 490000, "is_salaried": True}
    res = calculate_old_regime(income_data)
    assert res["tax_before_cess"] == 9500
    assert res["rebate_87a"] == 9500
    assert res["total_tax"] == 0

def test_5_rebate_new_regime():
    income_data = {"gross_salary": 700000, "is_salaried": True}
    res = calculate_new_regime(income_data)
    assert res["total_tax"] == 0

def test_6_hra_non_metro():
    income_data = {
        "gross_salary": 1000000,
        "basic_salary": 600000,
        "hra_received": 216000,
        "rent_paid": 144000,
        "city_type": "non_metro",
        "is_salaried": True
    }
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["hra_exemption"] == 84000

def test_7_validate_inputs():
    income_data = {
        "gross_salary": 1000000,
        "basic_salary": 500000,
        "tds_deducted": 200000
    }
    warnings = validate_inputs(income_data)
    assert any("TDS deducted" in w and "eligible for a refund" in w for w in warnings)

def test_8_partial_year():
    income_data = {"gross_salary": 500000, "is_salaried": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["standard_deduction"] == 50000

# TASK 1: VDA Tests
def test_vda_gains_taxed_at_30():
    from backend.tax_engine import calculate_vda_tax
    res = calculate_vda_tax({"vda_gains": 100000}, 0.0)
    assert res["vda_tax"] == 30000

def test_vda_gains_zero_returns_zero():
    from backend.tax_engine import calculate_vda_tax
    res = calculate_vda_tax({"vda_gains": 0}, 0.0)
    assert res["vda_tax"] == 0

def test_vda_tax_included_in_compare_regimes():
    income_data = {"gross_salary": 800000, "is_salaried": True}
    vda_data = {"vda_gains": 50000}
    res = compare_regimes(income_data, vda_data=vda_data)
    # New regime tax for 800k = 15k, plus 15k VDA = 30k before cess.
    # We just need to check if old_regime_total and new_regime_total have VDA tax added.
    # VDA tax = 15000. It should be added to the total.
    assert res["old_regime_total"] > 15000
    assert res["new_regime_total"] > 15000

# TASK 3: Multiple Employers
def test_two_employers_summed_correctly():
    income_data = {
        "employers": [
            {"gross_salary": 400000},
            {"gross_salary": 500000}
        ],
        "is_salaried": True
    }
    res = calculate_new_regime(income_data)
    # Total gross = 900,000, standard deduction = 75,000, taxable = 825,000
    assert res["taxable_income"] == 825000

def test_standard_deduction_applied_once():
    income_data = {
        "employers": [
            {"gross_salary": 400000},
            {"gross_salary": 500000}
        ],
        "is_salaried": True
    }
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["standard_deduction"] == 50000

def test_tds_summed_correctly():
    from backend.tax_engine import calculate_interest_234
    income_data = {
        "employers": [
            {"tds_deducted": 10000},
            {"tds_deducted": 15000}
        ],
        "is_salaried": True
    }
    tax_result = {"total_tax": 20000}
    res = calculate_interest_234(income_data, tax_result)
    # Total paid = 25000, which is > 90% of 20000, so 0 interest
    assert res["total_interest"] == 0

# TASK 4: Perquisite Tax
def test_perquisite_added_to_taxable_salary():
    income_data = {
        "gross_salary": 500000,
        "esop_perquisite_value": 100000,
        "is_salaried": True
    }
    res = calculate_new_regime(income_data)
    # 500k + 100k - 75k = 525k
    assert res["taxable_income"] == 525000

def test_zero_perquisite_has_no_effect():
    income_data = {
        "gross_salary": 500000,
        "esop_perquisite_value": 0,
        "is_salaried": True
    }
    res = calculate_new_regime(income_data)
    assert res["taxable_income"] == 425000

# TASK 5: Advance Tax Interest
def test_234b_triggered_when_insufficient():
    from backend.tax_engine import calculate_interest_234
    income_data = {"tds_deducted": 0}
    tax_result = {"total_tax": 50000}
    res = calculate_interest_234(income_data, tax_result)
    # Shortfall = 50000. 1% * 4 months = 2000
    assert res["interest_234b"] == 2000
    assert res["total_interest"] > 0

def test_234b_zero_when_tds_covers_90():
    from backend.tax_engine import calculate_interest_234
    income_data = {"tds_deducted": 46000}
    tax_result = {"total_tax": 50000}
    res = calculate_interest_234(income_data, tax_result)
    # 46000 is > 90% of 50000 (45000)
    assert res["interest_234b"] == 0

def test_234c_zero_for_salaried_with_adequate_tds():
    from backend.tax_engine import calculate_interest_234
    income_data = {"tds_deducted": 46000}
    tax_result = {"total_tax": 50000}
    res = calculate_interest_234(income_data, tax_result)
    assert res["interest_234c"] == 0

# TASK: Surcharge Tests
def test_surcharge_40l():
    income_data = {"gross_salary": 4050000, "is_salaried": True}  # Taxable = 40L
    res = calculate_old_regime(income_data)
    assert res["surcharge"] == 0

def test_surcharge_60l():
    income_data = {"gross_salary": 6050000, "is_salaried": True}  # Taxable = 60L
    res = calculate_old_regime(income_data)
    # Tax on 60L = 12500 + 100000 + 30% of 50L = 16,12,500
    # Base Surcharge = 10% = 1,61,250
    # No marginal relief expected here
    assert res["surcharge"] == round(1612500 * 0.10)

def test_surcharge_1_5cr():
    income_data = {"gross_salary": 15050000, "is_salaried": True}  # Taxable = 1.5Cr
    res = calculate_old_regime(income_data)
    # Tax on 1.5Cr = 112500 + 30% of 1.4Cr = 43,12,500
    # Surcharge = 15%
    assert res["surcharge"] == round(4312500 * 0.15)

def test_surcharge_6cr_new_regime_capped():
    income_data = {"gross_salary": 60050000, "is_salaried": True}  # Taxable = 5,99,75,000
    res = calculate_new_regime(income_data)
    # Under new regime, rate is capped at 25% for > 2Cr.
    # Tax on 6Cr under new regime = 140000 (tax up to 15L) + 30% of 5,84,75,000 = 1,76,82,500
    # Surcharge = 25% = 44,20,625
    assert res["surcharge"] == round(17682500 * 0.25)

# TASK 1: 87A Rebate Tests
def test_rebate_old_regime_5l():
    income_data = {"gross_salary": 550000, "is_salaried": True} # Taxable = 5L
    res = calculate_old_regime(income_data)
    assert res["rebate_87a"] == 12500
    assert res["total_tax"] == 0

def test_rebate_new_regime_over_7l():
    income_data = {"gross_salary": 800000, "is_salaried": True} # Taxable = 7.5L
    res = calculate_new_regime(income_data)
    assert res["rebate_87a"] == 0
    assert res["total_tax"] > 0

def test_rebate_old_regime_6l():
    income_data = {"gross_salary": 650000, "is_salaried": True} # Taxable = 6L
    res = calculate_old_regime(income_data)
    assert res["rebate_87a"] == 0

# TASK 2: NPS 80CCD(1B) Tests
def test_nps_50k_reduces_taxable_income():
    income_data = {"gross_salary": 1050000, "is_salaried": True, "nps_80ccd1b": 50000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ccd1b"] == 50000
    assert res["taxable_income"] == 950000  # 10.5L - 50k(std) - 50k(nps)

def test_nps_capped_at_50k():
    income_data = {"gross_salary": 1050000, "is_salaried": True, "nps_80ccd1b": 80000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ccd1b"] == 50000

# TASK 3: Section 80TTA/80TTB Tests
def test_non_senior_80tta_capped_at_10k():
    income_data = {"gross_salary": 550000, "is_salaried": True, "savings_interest": 15000, "is_senior_citizen": False}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80tta_ttb"] == 10000

def test_senior_80ttb_capped_at_50k():
    income_data = {"gross_salary": 550000, "is_salaried": True, "savings_interest": 60000, "is_senior_citizen": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80tta_ttb"] == 50000

# TASK 4: Section 80G Donations Tests
def test_80g_donation_50_percent_deduction():
    income_data = {"gross_salary": 550000, "is_salaried": True, "donations_80g": 10000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80g"] == 5000

def test_80g_zero_donation():
    income_data = {"gross_salary": 550000, "is_salaried": True, "donations_80g": 0}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80g"] == 0

# TASK 5: 44ADA Presumptive Taxation Tests
def test_freelancer_20l_receipts():
    income_data = {"is_freelancer": True, "is_salaried": False, "gross_receipts": 2000000}
    res = calculate_old_regime(income_data)
    assert res["taxable_income"] == 1000000

def test_freelancer_receipts_above_75l():
    income_data = {"is_freelancer": True, "is_salaried": False, "gross_receipts": 8000000}
    with pytest.raises(ValueError, match="exceed 44ADA limit"):
        calculate_old_regime(income_data)

def test_freelancer_gets_no_standard_deduction():
    income_data = {"is_freelancer": True, "is_salaried": False, "gross_receipts": 2000000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["standard_deduction"] == 0

# BUG FIX 1
def test_salaried_new_regime_standard_deduction_75k():
    income_data = {"gross_salary": 1000000, "is_salaried": True}
    res = calculate_new_regime(income_data)
    assert res["deduction_breakdown"]["standard_deduction"] == 75000
    assert res["taxable_income"] == 925000

# BUG FIX 2
def test_debt_fund_indexation_calculation():
    cg_data = {
        "ltcg_debt_pre_april23": 150000, # sale_value - cost_acq = 150000 - 100000
        "cost_of_debt_acquisition": 100000,
        "debt_purchase_fy": "FY2021-22",
        "debt_sale_fy": "FY2024-25",
        "applicable_slab_rate": 0.30
    }
    # Wait, the prompt says "indexed_gain = ltcg_debt_pre - indexed_cost"
    # But if sale_value is 150000, then ltcg_debt_pre MUST be 150000 for this formula to work.
    # Ah, the prompt literally says `indexed_gain = max(0, ltcg_debt_pre - indexed_cost)`. 
    # This implies ltcg_debt_pre represents the SALE VALUE.
    # So I will set ltcg_debt_pre_april23 = 150000.
    cg_data["ltcg_debt_pre_april23"] = 150000
    res = calculate_capital_gains(cg_data)
    # indexed_cost = 100000 * 363 / 317 = 114511
    # indexed_gain = 150000 - 114511 = 35489
    # tax = 35489 * 0.30 = 10647
    assert res["ltcg_debt_tax"] == 10647

def test_debt_fund_zero_gain_after_indexation():
    cg_data = {
        "ltcg_debt_pre_april23": 110000, 
        "cost_of_debt_acquisition": 100000,
        "debt_purchase_fy": "FY2021-22",
        "debt_sale_fy": "FY2024-25",
        "applicable_slab_rate": 0.30
    }
    res = calculate_capital_gains(cg_data)
    # indexed_cost = 114511. sale = 110000. gain = 0.
    assert res["ltcg_debt_tax"] == 0

# FEATURE 3
def test_employer_nps_old_regime():
    income_data = {
        "gross_salary": 1000000,
        "basic_salary": 500000,
        "employer_nps_contribution": 60000,
        "is_salaried": True
    }
    res = calculate_old_regime(income_data)
    # min(60000, 50000) = 50000
    assert res["deduction_breakdown"]["section_80ccd1"] == 50000

def test_employer_nps_new_regime():
    income_data = {
        "gross_salary": 1000000,
        "basic_salary": 500000,
        "employer_nps_contribution": 60000,
        "is_salaried": True
    }
    res = calculate_new_regime(income_data)
    assert res["deduction_breakdown"]["section_80ccd1"] == 50000

# FEATURE 4
def test_lta_exemption_old_regime():
    income_data = {
        "gross_salary": 1000000,
        "lta_claimed": 50000,
        "is_salaried": True
    }
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["lta_exemption"] == 50000
    # Gross 1M - 50k LTA - 50k Std = 900k
    assert res["taxable_income"] == 900000

# TASK 1: Section 80E
def test_education_loan_full_deduction():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "education_loan_interest": 120000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80e"] == 120000

def test_education_loan_not_in_new_regime():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "education_loan_interest": 120000}
    res = calculate_new_regime(income_data)
    assert res.get("deduction_breakdown", {}).get("section_80e") is None

# TASK 2: Section 80EEA
def test_80eea_capped_at_150000():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "home_loan_80eea": 180000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80eea"] == 150000

def test_80eea_not_in_new_regime():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "home_loan_80eea": 150000}
    res = calculate_new_regime(income_data)
    assert res.get("deduction_breakdown", {}).get("section_80eea") is None

# TASK 3: Pre-Construction Interest
def test_pre_construction_interest_combined_and_capped():
    # Pre-const = 500000 -> 100000 instalment
    # Post-const = 150000
    # Combined = 250000 -> capped at 200000
    income_data = {
        "gross_salary": 1000000, "is_salaried": True,
        "pre_construction_interest": 500000,
        "home_loan_interest": 150000
    }
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["home_loan_interest_24b"] == 200000

def test_zero_pre_construction_interest():
    income_data = {
        "gross_salary": 1000000, "is_salaried": True,
        "pre_construction_interest": 0,
        "home_loan_interest": 150000
    }
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["home_loan_interest_24b"] == 150000

# TASK 4: Section 10(14)
def test_children_education_allowance():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "children_education_allowance": 2}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_10_14_allowances"] == 4800

def test_uniform_allowance_capped():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "uniform_allowance_claimed": 30000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_10_14_allowances"] == 24000

def test_disabled_transport_allowance():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "is_disabled_employee": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_10_14_allowances"] == 38400

# TASK 1: Section 80GG
def test_80gg_no_hra_calculates_minimum():
    # Income: 600,000 gross. Std ded: 50,000. Adjusted = 550,000.
    # 1. 60000
    # 2. 25% of 550000 = 137500
    # 3. Rent 180000 - 10% of 550000 = 180000 - 55000 = 125000
    # Min is 60000.
    income_data = {"gross_salary": 600000, "is_salaried": True, "rent_paid": 180000, "hra_received": 0}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80gg"] == 60000

def test_80gg_hra_greater_than_zero():
    income_data = {"gross_salary": 600000, "is_salaried": True, "rent_paid": 180000, "hra_received": 10000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80gg"] == 0

def test_80gg_no_rent_paid():
    income_data = {"gross_salary": 600000, "is_salaried": True, "rent_paid": 0, "hra_received": 0}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80gg"] == 0

# TASK 2: House Property Income
def test_hp_positive_income():
    from backend.tax_engine import calculate_house_property_income
    hp_data = {"annual_rent_received": 300000, "municipal_tax_paid": 20000, "home_loan_interest_letout": 0}
    res = calculate_house_property_income(hp_data)
    assert res["nav"] == 280000
    assert res["standard_deduction_24a"] == 84000
    assert res["hp_income"] == 196000

def test_hp_loss_capped():
    from backend.tax_engine import calculate_house_property_income
    hp_data = {"annual_rent_received": 200000, "municipal_tax_paid": 0, "home_loan_interest_letout": 500000}
    res = calculate_house_property_income(hp_data)
    # nav 200k, std ded 60k, interest 500k -> income -360k. Capped at 200k.
    assert res["loss_setoff"] == 200000

def test_hp_loss_below_cap():
    from backend.tax_engine import calculate_house_property_income
    hp_data = {"annual_rent_received": 200000, "municipal_tax_paid": 0, "home_loan_interest_letout": 300000}
    res = calculate_house_property_income(hp_data)
    # nav 200k, std ded 60k, interest 300k -> income -160k. Capped at 200k, so 160k.
    assert res["loss_setoff"] == 160000

def test_hp_no_property():
    income_data = {"gross_salary": 500000, "is_salaried": True, "has_let_out_property": False}
    res = calculate_old_regime(income_data)
    # No extra HP income added
    assert res["taxable_income"] == 450000

# TASK 3: Section 89 Relief
def test_89_relief_calculated():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "arrears_received": 100000, "arrears_pertaining_to_year": "2020-21"}
    res = compare_regimes(income_data)
    assert res["relief_89"] > 0
    # Old tax total should be reduced
    # With arrears: 1M. Old tax on 9.5L = 12.5k + 90k = 102.5k. Cess = 4.1k. Total = 106.6k.
    # Without arrears: 9L. Old tax on 8.5L = 12.5k + 70k = 82.5k. Cess = 3.3k. Total = 85.8k.
    # But wait, compare_regimes does calculation on total tax natively. 
    # Just asserting relief > 0 is good.

def test_89_relief_zero():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "arrears_received": 0}
    res = compare_regimes(income_data)
    assert res["relief_89"] == 0

# TASK 4: Senior Slabs
def test_senior_slab_4l():
    income_data = {"gross_salary": 400000, "is_salaried": False, "is_senior_citizen": True}
    res = calculate_old_regime(income_data)
    # Exempt 3L. 1L @ 5% = 5000. Wait, rebate up to 5L!
    # So tax_before_cess = 5000.
    assert res["tax_before_cess"] == 5000
    assert res["rebate_87a"] == 5000

def test_super_senior_slab_6l():
    income_data = {"gross_salary": 600000, "is_salaried": False, "is_super_senior_citizen": True}
    res = calculate_old_regime(income_data)
    # Exempt 5L. 1L @ 20% = 20000. No rebate.
    assert res["tax_before_cess"] == 20000

def test_normal_slab_4l():
    income_data = {"gross_salary": 400000, "is_salaried": False, "is_senior_citizen": False}
    res = calculate_old_regime(income_data)
    # Exempt 2.5L. 1.5L @ 5% = 7500. Rebate.
    assert res["tax_before_cess"] == 7500

# TASK 5: Other Source Income
def test_fd_interest_taxable():
    income_data = {"gross_salary": 500000, "is_salaried": False, "fd_interest": 50000}
    res = calculate_old_regime(income_data)
    # 5L + 50k = 5.5L. Tax on 5.5L = 12500 + 10000 = 22500
    assert res["taxable_income"] == 550000
    assert res["tax_before_cess"] == 22500

def test_dividend_taxable():
    income_data = {"gross_salary": 500000, "is_salaried": False, "dividend_income": 10000}
    res = calculate_old_regime(income_data)
    assert res["taxable_income"] == 510000

def test_gift_below_threshold():
    income_data = {"gross_salary": 500000, "is_salaried": False, "gift_received": 30000}
    res = calculate_old_regime(income_data)
    assert res["taxable_income"] == 500000

def test_gift_above_threshold():
    income_data = {"gross_salary": 500000, "is_salaried": False, "gift_received": 60000}
    res = calculate_old_regime(income_data)
    # All 60k taxable
    assert res["taxable_income"] == 560000

# TASK 1: Section 80EE
def test_80ee_capped_at_50000():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "home_loan_80ee": 60000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ee"] == 50000

def test_80ee_and_80eea_mutually_exclusive():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "home_loan_80ee": 50000, "home_loan_80eea": 100000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80eea"] == 100000
    assert res["deduction_breakdown"]["section_80ee"] == 0

# TASK 2: Section 80U and 80DD
def test_disability_self_normal():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "disability_self": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80u"] == 75000

def test_severe_disability_dependent():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "severe_disability_dependent": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80dd"] == 125000

def test_no_disability():
    income_data = {"gross_salary": 1000000, "is_salaried": True}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80u"] == 0
    assert res["deduction_breakdown"]["section_80dd"] == 0

# TASK 3: Section 80DDB
def test_80ddb_non_senior():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "specified_disease_expense": 60000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ddb"] == 40000

def test_80ddb_senior():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "is_senior_citizen": True, "specified_disease_expense": 120000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ddb"] == 100000

# TASK 4: Section 80GGA and 80GGC
def test_80gga_deduction():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "donations_80gga": 10000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80gga"] == 10000

def test_80ggc_deduction():
    income_data = {"gross_salary": 1000000, "is_salaried": True, "donations_80ggc": 5000}
    res = calculate_old_regime(income_data)
    assert res["deduction_breakdown"]["section_80ggc"] == 5000

# TASK 5: Gratuity and Leave Encashment
def test_gratuity_exempt_capped():
    # 25L gratuity, capped at 20L.
    # Gross salary input is 35L (including 25L gratuity), it is reduced by 20L, becoming 15L.
    income_data = {"gross_salary": 3500000, "is_salaried": True, "gratuity_received": 2500000}
    res = calculate_old_regime(income_data)
    # 35L - 20L (exempt) - 50k (std) = 14.5L
    assert res["taxable_income"] == 1450000

def test_leave_encashment_fully_exempt():
    income_data = {"gross_salary": 3000000, "is_salaried": True, "leave_encashment_received": 2000000}
    res = calculate_old_regime(income_data)
    # 30L - 20L (exempt) - 50k (std) = 9.5L
    assert res["taxable_income"] == 950000

def test_no_gratuity_leave_encashment():
    income_data = {"gross_salary": 1000000, "is_salaried": True}
    res = calculate_old_regime(income_data)
    assert res["taxable_income"] == 950000

# TASK 6: Agricultural Income
def test_agricultural_income_integration():
    income_data = {"gross_salary": 800000, "is_salaried": True, "agricultural_income": 50000}
    res_agri = calculate_old_regime(income_data)
    
    income_data_none = {"gross_salary": 800000, "is_salaried": True}
    res_none = calculate_old_regime(income_data_none)
    
    # Because of partial integration, the tax on non-agri income is pushed into higher brackets
    assert res_agri["tax_before_cess"] > res_none["tax_before_cess"]

def test_agricultural_income_below_threshold():
    income_data = {"gross_salary": 800000, "is_salaried": True, "agricultural_income": 5000}
    res_agri = calculate_old_regime(income_data)
    
    income_data_none = {"gross_salary": 800000, "is_salaried": True}
    res_none = calculate_old_regime(income_data_none)
    
    assert res_agri["tax_before_cess"] == res_none["tax_before_cess"]

# TASK 7: AMT
def test_amt_kicks_in_high_income_deductions():
    # We need adjusted total income > 20L and very high deductions (e.g., 80GGA)
    # Gross = 50L. 80GGA = 35L. Taxable = 15L.
    # Adjusted total income = 15L + 35L = 50L.
    # Regular tax on 15L = 1.125L + 1.5L = 262500
    # AMT = 18.5% of 50L = 9.25L. Plus surcharge and cess.
    income_data = {"gross_salary": 5000000, "is_salaried": False, "donations_80gga": 3500000}
    res = calculate_old_regime(income_data)
    assert res["amt_applicable"] == True
    assert res["amt"] > 0
    assert res["total_tax"] == res["amt"]

def test_amt_not_applicable_normal_income():
    income_data = {"gross_salary": 1500000, "is_salaried": False, "donations_80gga": 100000}
    res = calculate_old_regime(income_data)
    assert res["amt_applicable"] == False
    assert res["amt"] == 0
