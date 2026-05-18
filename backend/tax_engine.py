import math

CII = {
    "FY2001-02": 100, "FY2002-03": 105, "FY2003-04": 109,
    "FY2004-05": 113, "FY2005-06": 117, "FY2006-07": 122,
    "FY2007-08": 129, "FY2008-09": 137, "FY2009-10": 148,
    "FY2010-11": 167, "FY2011-12": 184, "FY2012-13": 200,
    "FY2013-14": 220, "FY2014-15": 240, "FY2015-16": 254,
    "FY2016-17": 264, "FY2017-18": 272, "FY2018-19": 280,
    "FY2019-20": 289, "FY2020-21": 301, "FY2021-22": 317,
    "FY2022-23": 331, "FY2023-24": 348, "FY2024-25": 363,
}

OLD_REGIME_SLABS = [
    (250000, 0.0),
    (500000, 0.05),
    (1000000, 0.20),
    (float('inf'), 0.30)
]

NEW_REGIME_SLABS = [
    (300000, 0.0),
    (700000, 0.05),
    (1000000, 0.10),
    (1200000, 0.15),
    (1500000, 0.20),
    (float('inf'), 0.30)
]

SENIOR_OLD_SLABS = [
    (300000, 0.0),
    (500000, 0.05),
    (1000000, 0.20),
    (float('inf'), 0.30)
]

SUPER_SENIOR_OLD_SLABS = [
    (500000, 0.0),
    (1000000, 0.20),
    (float('inf'), 0.30)
]

def _apply_slabs(income: int, slabs: list) -> int:
    tax = 0
    previous_limit = 0
    for limit, rate in slabs:
        if income > previous_limit:
            taxable_in_slab = min(income, limit) - previous_limit
            tax += taxable_in_slab * rate
        previous_limit = limit
    return round(tax)

def _marginal_rate(taxable_income: int, slabs: list) -> float:
    marginal = 0.0
    prev_limit = 0
    for limit, slab_rate in slabs:
        if taxable_income > prev_limit:
            marginal = slab_rate
        prev_limit = limit
    return marginal

def _compute_surcharge(tax_before_surcharge: int, taxable_income: int, regime: str) -> int:
    if taxable_income <= 5000000:
        return 0
        
    slabs = OLD_REGIME_SLABS if regime == "old" else NEW_REGIME_SLABS
    
    if taxable_income <= 10000000:
        rate = 0.10
        threshold = 5000000
        threshold_surcharge_rate = 0.0
    elif taxable_income <= 20000000:
        rate = 0.15
        threshold = 10000000
        threshold_surcharge_rate = 0.10
    elif taxable_income <= 50000000 or regime == "new":
        rate = 0.25
        threshold = 20000000
        threshold_surcharge_rate = 0.15
    else:
        rate = 0.37
        threshold = 50000000
        threshold_surcharge_rate = 0.25
        
    base_surcharge = tax_before_surcharge * rate
    
    tax_at_threshold = _apply_slabs(threshold, slabs)
    surcharge_at_threshold = tax_at_threshold * threshold_surcharge_rate
    
    total_tax_at_threshold = tax_at_threshold + surcharge_at_threshold
    excess_income = taxable_income - threshold
    
    max_tax_allowed = total_tax_at_threshold + excess_income
    actual_tax_calculated = tax_before_surcharge + base_surcharge
    
    if actual_tax_calculated > max_tax_allowed:
        relief = actual_tax_calculated - max_tax_allowed
        base_surcharge -= relief
        
    return round(max(0, base_surcharge))

def _compute_hra_exemption(income_data: dict) -> int:
    if not income_data.get("is_salaried", False):
        return 0
    hra_received = income_data.get("hra_received", 0)
    rent_paid = income_data.get("rent_paid", 0)
    basic_salary = income_data.get("basic_salary", 0)
    
    if hra_received <= 0 or rent_paid <= 0 or basic_salary <= 0:
        return 0
        
    metro_pct = 0.50 if income_data.get("city_type") == "metro" else 0.40
    
    comp1 = hra_received
    comp2 = round(basic_salary * metro_pct)
    comp3 = max(0, rent_paid - round(0.10 * basic_salary))
    
    return min(comp1, comp2, comp3)

def calculate_vda_tax(vda_data: dict, applicable_slab_rate: float) -> dict:
    vda_gains = vda_data.get("vda_gains", 0)
    tds_on_vda = vda_data.get("tds_on_vda", 0)
    vda_tax = round(max(0, vda_gains) * 0.30)
    return {
        "vda_tax": vda_tax,
        "vda_gains": vda_gains,
        "tds_on_vda": tds_on_vda
    }

def calculate_perquisite_tax(perq_data: dict, applicable_slab_rate: float) -> dict:
    esop_perquisite_value = perq_data.get("esop_perquisite_value", 0)
    perquisite_tax = round(esop_perquisite_value * applicable_slab_rate)
    return {
        "perquisite_tax": perquisite_tax,
        "perquisite_value": esop_perquisite_value
    }

def calculate_interest_234(income_data: dict, tax_result: dict) -> dict:
    total_tax = tax_result["total_tax"]
    
    employers = income_data.get("employers", [])
    if employers:
        tds = sum(e.get("tds_deducted", 0) for e in employers)
    else:
        tds = income_data.get("tds_deducted", 0)
        
    tds += income_data.get("tds_on_vda", 0)
    advance_tax_paid = income_data.get("advance_tax_paid", 0)
    total_paid = tds + advance_tax_paid
    
    interest_234b = 0
    interest_234c = 0
    
    if total_tax > 10000:
        shortfall = max(0, total_tax - total_paid)
        if total_paid < 0.90 * total_tax:
            interest_234b = round(shortfall * 0.01 * 4)
            interest_234c = round(shortfall * 0.01 * 3)
            
    total_interest = interest_234b + interest_234c
    
    return {
        "interest_234b": interest_234b,
        "interest_234c": interest_234c,
        "total_interest": total_interest,
        "total_payable_with_interest": total_tax + total_interest
    }

def calculate_presumptive_44ada(income_data: dict) -> dict:
    gross_receipts = income_data.get("gross_receipts", 0)
    if gross_receipts > 7500000:
        raise ValueError("Gross receipts exceed 44ADA limit of ₹75L. Use regular ITR-3.")
    presumptive_income = round(gross_receipts * 0.50)
    return {
        "presumptive_income": presumptive_income,
        "gross_receipts": gross_receipts
    }

def calculate_house_property_income(hp_data: dict) -> dict:
    annual_rent_received = hp_data.get("annual_rent_received", 0)
    municipal_tax_paid = hp_data.get("municipal_tax_paid", 0)
    nav = annual_rent_received - municipal_tax_paid
    standard_deduction_24a = round(nav * 0.30) if nav > 0 else 0
    home_loan_interest_letout = hp_data.get("home_loan_interest_letout", 0)
    
    hp_income = nav - standard_deduction_24a - home_loan_interest_letout
    loss_setoff = min(abs(min(0, hp_income)), 200000) if hp_income < 0 else 0
    
    return {
        "nav": nav,
        "standard_deduction_24a": standard_deduction_24a,
        "hp_income": hp_income,
        "loss_setoff": loss_setoff,
        "home_loan_interest_letout": home_loan_interest_letout
    }

def calculate_89_relief(income_data: dict) -> dict:
    arrears_received = income_data.get("arrears_received", 0)
    if arrears_received <= 0:
        return {"relief_89": 0, "arrears_received": 0}
        
    taxable_with = max(0, income_data.get("gross_salary", 0))
    taxable_without = max(0, taxable_with - arrears_received)
    
    tax_with_arrears = _apply_slabs(taxable_with, NEW_REGIME_SLABS)
    tax_without_arrears = _apply_slabs(taxable_without, NEW_REGIME_SLABS)
    
    tax_prior_with = _apply_slabs(arrears_received, NEW_REGIME_SLABS)
    tax_prior_without = 0
    
    relief_89 = max(0, (tax_with_arrears - tax_without_arrears) - (tax_prior_with - tax_prior_without))
    return {"relief_89": relief_89, "arrears_received": arrears_received}

def calculate_other_income(income_data: dict) -> dict:
    fd_interest = income_data.get("fd_interest", 0)
    dividend_income = income_data.get("dividend_income", 0)
    gift_received = income_data.get("gift_received", 0)
    
    taxable_gift = gift_received if gift_received > 50000 else 0
    other_income_total = fd_interest + dividend_income + taxable_gift
    return {
        "fd_interest": fd_interest,
        "dividend_income": dividend_income,
        "taxable_gift": taxable_gift,
        "other_income_total": other_income_total
    }

def calculate_old_regime(income_data: dict) -> dict:
    is_freelancer = income_data.get("is_freelancer", False)
    is_salaried = income_data.get("is_salaried", False)
    
    if is_freelancer and not is_salaried:
        presumptive_data = calculate_presumptive_44ada(income_data)
        gross_salary = presumptive_data["presumptive_income"]
        std_deduction = 0
        hra_exemption = 0
        total_10_14 = 0
    else:
        employers = income_data.get("employers", [])
        if employers:
            gross_salary = sum(e.get("gross_salary", 0) for e in employers)
        else:
            gross_salary = income_data.get("gross_salary", 0)
            
        gross_salary += income_data.get("esop_perquisite_value", 0)
        
        uniform_exempt = min(income_data.get("uniform_allowance_claimed", 0), 24000)
        children_edu_exempt = min(income_data.get("children_education_allowance", 0), 2) * 2400
        hostel_exempt = min(income_data.get("hostel_allowance", 0), 2) * 7200
        transport_disabled = 38400 if income_data.get("is_disabled_employee", False) else 0
        total_10_14 = uniform_exempt + children_edu_exempt + hostel_exempt + transport_disabled

        lta_exemption = income_data.get("lta_claimed", 0)
        gratuity_exempt = min(income_data.get("gratuity_received", 0), 2000000)
        leave_encashment_exempt = min(income_data.get("leave_encashment_received", 0), 2500000)
        gross_salary = max(0, gross_salary - lta_exemption - total_10_14 - gratuity_exempt - leave_encashment_exempt)
        
        std_deduction = 50000 if is_salaried else 0
        hra_exemption = _compute_hra_exemption(income_data)
    
    sum_80c = (
        income_data.get("ppf", 0) + 
        income_data.get("elss", 0) + 
        income_data.get("lic_premium", 0) + 
        income_data.get("epf_employee", 0) + 
        income_data.get("home_loan_principal", 0)
    )
    sec_80c = min(sum_80c, 150000)
    
    pre_construction_interest = income_data.get("pre_construction_interest", 0)
    instalment = round(pre_construction_interest / 5)
    total_24b_eligible = income_data.get("home_loan_interest", 0) + instalment
    home_loan_int = min(total_24b_eligible, 200000)
    
    home_loan_80eea = income_data.get("home_loan_80eea", 0)
    sec_80eea = min(home_loan_80eea, 150000)
    
    sec_80ee = min(income_data.get("home_loan_80ee", 0), 50000) if sec_80eea == 0 else 0
    
    self_limit = 50000 if income_data.get("is_senior_citizen", False) else 25000
    parents_limit = 50000 if income_data.get("senior_citizen_parents", False) else 25000
    sec_80d = min(income_data.get("health_insurance_self", 0), self_limit) + \
              min(income_data.get("health_insurance_parents", 0), parents_limit)
    nps_80ccd = min(income_data.get("nps_80ccd1b", 0), 50000)
    
    savings_interest = income_data.get("savings_interest", 0)
    if income_data.get("is_senior_citizen", False):
        sec_80ttb = min(savings_interest, 50000)
        sec_80tta = 0
    else:
        sec_80tta = min(savings_interest, 10000)
        sec_80ttb = 0
        
    donations_80g = income_data.get("donations_80g", 0)
    sec_80g = round(donations_80g * 0.50)
    
    employer_nps = income_data.get("employer_nps_contribution", 0)
    sec_80ccd1 = min(employer_nps, round(income_data.get("basic_salary", 0) * 0.10))
    
    edu_loan_interest = income_data.get("education_loan_interest", 0)
    sec_80e = edu_loan_interest
    
    sec_80u = 125000 if income_data.get("severe_disability_self") else 75000 if income_data.get("disability_self") else 0
    sec_80dd = 125000 if income_data.get("severe_disability_dependent") else 75000 if income_data.get("disability_dependent") else 0
    
    limit_80ddb = 100000 if income_data.get("is_senior_citizen") else 40000
    sec_80ddb = min(income_data.get("specified_disease_expense", 0), limit_80ddb)
    
    sec_80gga = income_data.get("donations_80gga", 0)
    sec_80ggc = income_data.get("donations_80ggc", 0)
    
    deductions_before_80gg = std_deduction + sec_80c + hra_exemption + home_loan_int + sec_80d + nps_80ccd + sec_80tta + sec_80ttb + sec_80g + sec_80ccd1 + sec_80e + sec_80eea + sec_80ee + sec_80u + sec_80dd + sec_80ddb + sec_80gga + sec_80ggc
    
    sec_80gg = 0
    hra_received = income_data.get("hra_received", 0)
    rent_paid = income_data.get("rent_paid", 0)
    if hra_received == 0 and rent_paid > 0:
        adjusted_income = max(0, gross_salary - deductions_before_80gg)
        comp1 = 60000
        comp2 = round(adjusted_income * 0.25)
        comp3 = max(0, rent_paid - round(adjusted_income * 0.10))
        sec_80gg = max(0, min(comp1, comp2, comp3))
              
    total_deductions = deductions_before_80gg + sec_80gg
    
    hp_income_total = 0
    hp_loss_setoff = 0
    if income_data.get("has_let_out_property"):
        hp_data = income_data.get("hp_data", {})
        hp_result = calculate_house_property_income(hp_data)
        if hp_result["hp_income"] > 0:
            hp_income_total = hp_result["hp_income"]
        else:
            hp_loss_setoff = hp_result["loss_setoff"]
            
    other_income = calculate_other_income(income_data)
    effective_gross = gross_salary + hp_income_total + other_income["other_income_total"]
    
    taxable_income = max(0, effective_gross - total_deductions - hp_loss_setoff)
    
    if income_data.get("is_super_senior_citizen"):
        slabs = SUPER_SENIOR_OLD_SLABS
    elif income_data.get("is_senior_citizen"):
        slabs = SENIOR_OLD_SLABS
    else:
        slabs = OLD_REGIME_SLABS
        
    tax_before_cess = _apply_slabs(taxable_income, slabs)
    
    agricultural_income = income_data.get("agricultural_income", 0)
    if agricultural_income > 5000 and taxable_income > slabs[0][0]:
        tax_a = _apply_slabs(taxable_income + agricultural_income, slabs)
        tax_b = _apply_slabs(slabs[0][0] + agricultural_income, slabs)
        tax_before_cess = max(0, tax_a - tax_b)
    
    rebate_87a = min(tax_before_cess, 12500) if taxable_income <= 500000 else 0
    tax_after_rebate = max(0, tax_before_cess - rebate_87a)
        
    surcharge = _compute_surcharge(tax_after_rebate, taxable_income, "old")
    tax_after_rebate += surcharge
        
    cess = round(tax_after_rebate * 0.04)
    regular_tax = tax_after_rebate + cess
    
    chapter_6a_for_amt = sec_80g + sec_80gga + sec_80ggc + sec_80ee + sec_80eea + sec_80gg + sec_80ddb + sec_80u + sec_80dd + sec_80tta + sec_80ttb + sec_80e + nps_80ccd + sec_80ccd1
    adjusted_total_income = taxable_income + chapter_6a_for_amt
    amt_applicable = adjusted_total_income > 2000000
    
    if amt_applicable:
        amt_before_surcharge = round(adjusted_total_income * 0.185)
        amt_surcharge = _compute_surcharge(amt_before_surcharge, adjusted_total_income, "old")
        amt_cess = round((amt_before_surcharge + amt_surcharge) * 0.04)
        amt = amt_before_surcharge + amt_surcharge + amt_cess
    else:
        amt = 0
        
    final_tax = max(regular_tax, amt)
    total_tax = final_tax
    
    effective_rate = round((total_tax / gross_salary * 100), 2) if gross_salary > 0 else 0.0
    
    return {
        "taxable_income": taxable_income,
        "total_deductions": total_deductions,
        "tax_before_cess": tax_before_cess,
        "rebate_87a": rebate_87a,
        "surcharge": surcharge,
        "cess": cess,
        "total_tax": total_tax,
        "effective_rate": effective_rate,
        "deduction_breakdown": {
            "standard_deduction": std_deduction,
            "section_80c": sec_80c,
            "hra_exemption": hra_exemption,
            "home_loan_interest_24b": home_loan_int,
            "section_80d": sec_80d,
            "section_80ccd1b": nps_80ccd,
            "section_80tta_ttb": sec_80tta + sec_80ttb,
            "section_80g": sec_80g,
            "section_80ccd1": sec_80ccd1,
            "lta_exemption": income_data.get("lta_claimed", 0),
            "section_80e": sec_80e,
            "section_80ee": sec_80ee,
            "section_80eea": sec_80eea,
            "section_10_14_allowances": total_10_14,
            "section_80gg": sec_80gg,
            "section_80u": sec_80u,
            "section_80dd": sec_80dd,
            "section_80ddb": sec_80ddb,
            "section_80gga": sec_80gga,
            "section_80ggc": sec_80ggc
        },
        "amt_applicable": amt_applicable,
        "amt": amt
    }

def calculate_new_regime(income_data: dict) -> dict:
    is_freelancer = income_data.get("is_freelancer", False)
    is_salaried = income_data.get("is_salaried", False)
    
    if is_freelancer and not is_salaried:
        presumptive_data = calculate_presumptive_44ada(income_data)
        gross_salary = presumptive_data["presumptive_income"]
        std_deduction = 0
    else:
        employers = income_data.get("employers", [])
        if employers:
            gross_salary = sum(e.get("gross_salary", 0) for e in employers)
        else:
            gross_salary = income_data.get("gross_salary", 0)
            
        gross_salary += income_data.get("esop_perquisite_value", 0)
        gratuity_exempt = min(income_data.get("gratuity_received", 0), 2000000)
        leave_encashment_exempt = min(income_data.get("leave_encashment_received", 0), 2500000)
        gross_salary = max(0, gross_salary - gratuity_exempt - leave_encashment_exempt)
        std_deduction = 75000 if is_salaried else 0
        
    total_deductions = std_deduction
    
    employer_nps = income_data.get("employer_nps_contribution", 0)
    sec_80ccd1 = min(employer_nps, round(income_data.get("basic_salary", 0) * 0.10))
    total_deductions += sec_80ccd1
    
    hp_income_total = 0
    hp_loss_setoff = 0
    if income_data.get("has_let_out_property"):
        hp_data = income_data.get("hp_data", {})
        hp_result = calculate_house_property_income(hp_data)
        if hp_result["hp_income"] > 0:
            hp_income_total = hp_result["hp_income"]
        else:
            hp_loss_setoff = hp_result["loss_setoff"]
            
    other_income = calculate_other_income(income_data)
    effective_gross = gross_salary + hp_income_total + other_income["other_income_total"]
    
    taxable_income = max(0, effective_gross - total_deductions - hp_loss_setoff)
    
    tax_before_cess = _apply_slabs(taxable_income, NEW_REGIME_SLABS)
    
    rebate_87a = min(tax_before_cess, 25000) if taxable_income <= 700000 else 0
    tax_after_rebate = max(0, tax_before_cess - rebate_87a)
        
    surcharge = _compute_surcharge(tax_after_rebate, taxable_income, "new")
    tax_after_rebate += surcharge
        
    cess = round(tax_after_rebate * 0.04)
    total_tax = tax_after_rebate + cess
    
    effective_rate = round((total_tax / gross_salary * 100), 2) if gross_salary > 0 else 0.0
    
    return {
        "taxable_income": taxable_income,
        "total_deductions": total_deductions,
        "tax_before_cess": tax_before_cess,
        "rebate_87a": rebate_87a,
        "surcharge": surcharge,
        "cess": cess,
        "total_tax": total_tax,
        "effective_rate": effective_rate,
        "deduction_breakdown": {
            "standard_deduction": std_deduction,
            "section_80c": 0,
            "hra_exemption": 0,
            "home_loan_interest_24b": 0,
            "section_80d": 0,
            "section_80ccd1": sec_80ccd1
        }
    }

def calculate_capital_gains(cg_data: dict) -> dict:
    ltcg_equity = cg_data.get("ltcg_equity", 0)
    stcg_equity = cg_data.get("stcg_equity", 0)
    ltcg_debt_pre = cg_data.get("ltcg_debt_pre_april23", 0)
    ltcg_debt_post = cg_data.get("ltcg_debt_post_april23", 0)
    cost_acq = cg_data.get("cost_of_debt_acquisition", 0)
    
    slab_rate = cg_data.get("applicable_slab_rate", 0.0)
    
    exempt_ltcg_amount = min(ltcg_equity, 100000)
    taxable_ltcg_equity = max(0, ltcg_equity - 100000)
    ltcg_equity_tax = round(taxable_ltcg_equity * 0.10)
    
    stcg_equity_tax = round(stcg_equity * 0.15)
    
    ltcg_debt_tax_pre = 0
    if ltcg_debt_pre > 0 and cost_acq > 0:
        purch_fy = cg_data.get("debt_purchase_fy")
        sale_fy = cg_data.get("debt_sale_fy")
        if purch_fy in CII and sale_fy in CII:
            indexed_cost = round(cost_acq * (CII[sale_fy] / CII[purch_fy]))
            indexed_gain = max(0, ltcg_debt_pre - indexed_cost)
            if indexed_gain > 0:
                ltcg_debt_tax_pre = round(indexed_gain * slab_rate)
                
    ltcg_debt_tax_post = round(ltcg_debt_post * slab_rate)
    
    ltcg_debt_tax = ltcg_debt_tax_pre + ltcg_debt_tax_post
    total_cg_tax = ltcg_equity_tax + stcg_equity_tax + ltcg_debt_tax
    
    return {
        "ltcg_equity_tax": ltcg_equity_tax,
        "stcg_equity_tax": stcg_equity_tax,
        "ltcg_debt_tax": ltcg_debt_tax,
        "total_cg_tax": total_cg_tax,
        "exempt_ltcg_amount": exempt_ltcg_amount
    }

def compare_regimes(income_data: dict, cg_data: dict = None, vda_data: dict = None) -> dict:
    old = calculate_old_regime(income_data)
    new = calculate_new_regime(income_data)
    
    old_cg_tax = 0
    new_cg_tax = 0
    
    old_vda_tax = 0
    new_vda_tax = 0
    
    old_rate = _marginal_rate(old["taxable_income"], OLD_REGIME_SLABS)
    new_rate = _marginal_rate(new["taxable_income"], NEW_REGIME_SLABS)
    
    if cg_data:
        old_cg_data = cg_data.copy()
        old_cg_data["applicable_slab_rate"] = old_rate
        old_cg = calculate_capital_gains(old_cg_data)
        old_cg_tax = old_cg["total_cg_tax"]
        
        new_cg_data = cg_data.copy()
        new_cg_data["applicable_slab_rate"] = new_rate
        new_cg = calculate_capital_gains(new_cg_data)
        new_cg_tax = new_cg["total_cg_tax"]
        
    if vda_data:
        vda_result = calculate_vda_tax(vda_data, old_rate)
        old_vda_tax = vda_result["vda_tax"]
        new_vda_tax = vda_result["vda_tax"]
        
    old_total = old["total_tax"] + old_cg_tax + old_vda_tax
    new_total = new["total_tax"] + new_cg_tax + new_vda_tax
    
    recommended = "old" if old_total < new_total else "new"
    savings_amount = abs(old_total - new_total)
    
    if old_total == new_total:
        savings_explanation = "Both regimes result in the same tax liability."
    elif recommended == "old":
        brk = old["deduction_breakdown"]
        exceeding_deductions = brk["section_80c"] + brk["hra_exemption"] + brk["home_loan_interest_24b"] + brk["section_80d"]
        savings_explanation = (
            f"Old regime saves you ₹{savings_amount:,} because your deductions "
            f"(80C: ₹{brk['section_80c']:,}, HRA: ₹{brk['hra_exemption']:,}, "
            f"Home loan: ₹{brk['home_loan_interest_24b']:,}) exceed the standard deduction benefit of the new regime."
        )
    else:
        brk = old["deduction_breakdown"]
        total_deducs = brk["section_80c"] + brk["hra_exemption"] + brk["home_loan_interest_24b"] + brk["section_80d"]
        savings_explanation = (
            f"New regime saves you ₹{savings_amount:,} because your deductions "
            f"(₹{total_deducs:,} total) are less than the new regime's lower slab benefit."
        )
        
    
    old.update(calculate_interest_234(income_data, {"total_tax": old_total}))
    new.update(calculate_interest_234(income_data, {"total_tax": new_total}))
    
    relief_89_data = calculate_89_relief(income_data)
    relief_89 = relief_89_data["relief_89"]
    
    old_total = max(0, old_total - relief_89)
    new_total = max(0, new_total - relief_89)
    
    return {
        "old_regime": old,
        "new_regime": new,
        "old_regime_total": old.get("total_payable_with_interest", old_total),
        "new_regime_total": new.get("total_payable_with_interest", new_total),
        "recommended_regime": recommended,
        "savings_amount": savings_amount,
        "savings_explanation": savings_explanation,
        "relief_89": relief_89
    }

def validate_inputs(income_data: dict) -> list[str]:
    warnings = []
    
    gross = income_data.get("gross_salary", 0)
    if gross < 0:
        warnings.append("Gross salary cannot be negative.")
        
    basic = income_data.get("basic_salary", 0)
    rent = income_data.get("rent_paid", 0)
    if rent > 0 and basic == 0:
        warnings.append("Rent paid is specified but basic salary is 0. HRA exemption cannot be calculated.")
        
    hra = income_data.get("hra_received", 0)
    if hra > gross and gross > 0:
        warnings.append(f"HRA received (₹{hra}) exceeds total gross salary (₹{gross}). Please verify.")
        
    sum_80c = (
        income_data.get("ppf", 0) + 
        income_data.get("elss", 0) + 
        income_data.get("lic_premium", 0) + 
        income_data.get("epf_employee", 0) + 
        income_data.get("home_loan_principal", 0)
    )
    if sum_80c > 150000:
        excess = sum_80c - 150000
        warnings.append(f"Total 80C investments (₹{sum_80c}) exceed the ₹1,50,000 limit. Excess ₹{excess} will be ignored in calculations.")
        
    home_loan = income_data.get("home_loan_interest", 0)
    if home_loan > 200000:
        excess = home_loan - 200000
        warnings.append(f"Home loan interest claimed (₹{home_loan}) exceeds the Section 24(b) limit of ₹2,00,000. Excess ₹{excess} will be ignored.")
        
    employers = income_data.get("employers", [])
    if employers:
        tds = sum(e.get("tds_deducted", 0) for e in employers)
    else:
        tds = income_data.get("tds_deducted", 0)
        
    tds += income_data.get("tds_on_vda", 0)
    old = calculate_old_regime(income_data)
    new = calculate_new_regime(income_data)
    expected_tax = min(old["total_tax"], new["total_tax"])
    
    if expected_tax >= 0 and tds > expected_tax * 1.20:
        warnings.append(f"TDS deducted (₹{tds}) exceeds estimated tax liability (₹{expected_tax}) by more than 20%. You may be eligible for a refund.")
        
    if income_data.get("donations_80g", 0) > 2000:
        warnings.append("Note: Cash donations above ₹2,000 are not eligible for 80G deduction. Make sure they were digital/cheque.")
        
    return warnings
