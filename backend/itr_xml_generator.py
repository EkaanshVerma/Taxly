import xml.etree.ElementTree as ET
import re
from datetime import date

STATE_MAPPING = {
    "maharashtra": "MH",
    "delhi": "DL",
    "karnataka": "KA",
    "tamil nadu": "TN",
    "gujarat": "GJ",
    "rajasthan": "RJ",
    "uttar pradesh": "UP",
    "west bengal": "WB",
    "andhra pradesh": "AP",
    "telangana": "TS",
    "haryana": "HR",
    "madhya pradesh": "MP",
    "punjab": "PB",
    "bihar": "BR",
    "kerala": "KL",
    "odisha": "OD",
    "chhattisgarh": "CT",
    "jharkhand": "JH",
    "assam": "AS",
    "manipur": "MN",
    "meghalaya": "ML",
    "mizoram": "MZ",
    "nagaland": "NL",
    "tripura": "TR",
    "sikkim": "SK",
    "arunachal pradesh": "AR",
    "himachal pradesh": "HP",
    "jammu and kashmir": "JK",
    "ladakh": "LA",
    "andaman and nicobar islands": "AN",
    "lakshadweep": "LD",
    "dadra and nagar haveli and daman and diu": "DN",
    "chhattisgarh": "CT",
    "chandigarh": "CH",
    
    
}

def _state_code(state_name: str) -> str:
    if not state_name:
        return "OTH"
    return STATE_MAPPING.get(state_name.strip().lower(), "OTH")

def _employer_category(employer_type: str) -> str:
    if not employer_type:
        return "OTH"
    emp_type = employer_type.strip().lower()
    if emp_type == "government":
        return "GOV"
    elif emp_type == "psu":
        return "PSU"
    return "OTH"

def _format_date(date_str: str) -> str:
    if not date_str:
        return ""
    try:
        parts = date_str.split("-")
        if len(parts) == 3 and len(parts[0]) == 4:
            return f"{parts[2]}/{parts[1]}/{parts[0]}"
    except Exception:
        pass
    return date_str

def _validate_pan(pan: str):
    if not pan or not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", pan):
        raise ValueError(f"Invalid PAN format: {pan}")

def _build_base_itr_tree(form_type: str, taxpayer: dict, income_data: dict, tax_result: dict) -> ET.Element:
    _validate_pan(taxpayer.get("pan", ""))
    
    itr_root = ET.Element("ITR")
    form_root = ET.SubElement(itr_root, form_type)
    
    # PersonalInfo
    p_info = ET.SubElement(form_root, "PersonalInfo")
    ET.SubElement(p_info, "AssesseeType").text = "I"
    ET.SubElement(p_info, "PAN").text = taxpayer.get("pan", "")
    ET.SubElement(p_info, "Name").text = taxpayer.get("name", "")
    ET.SubElement(p_info, "DOB").text = _format_date(taxpayer.get("dob", ""))
    ET.SubElement(p_info, "AadhaarCardNo").text = ""
    
    address = ET.SubElement(p_info, "Address")
    ET.SubElement(address, "ResidenceName").text = ""
    ET.SubElement(address, "ResidenceNo").text = taxpayer.get("address", "")
    ET.SubElement(address, "CityOrTownOrDistrict").text = taxpayer.get("city", "")
    ET.SubElement(address, "StateCode").text = _state_code(taxpayer.get("state", ""))
    ET.SubElement(address, "PinCode").text = taxpayer.get("pincode", "")
    ET.SubElement(address, "CountryCode").text = "91"
    ET.SubElement(address, "MobileNo").text = taxpayer.get("mobile", "")
    ET.SubElement(address, "EmailAddress").text = taxpayer.get("email", "")
    
    ET.SubElement(p_info, "EmployerCategory").text = _employer_category(taxpayer.get("employer_type", ""))
    
    # FilingStatus
    fs = ET.SubElement(form_root, "FilingStatus")
    ET.SubElement(fs, "AssessmentYear").text = taxpayer.get("assessment_year", "")
    ET.SubElement(fs, "ReturnFiledUnderSection").text = "11"
    ET.SubElement(fs, "SeqNoOfReturn").text = "1"
    
    # PartBTI
    gross_salary = income_data.get("gross_salary", 0)
    taxable_income = tax_result.get("taxable_income", 0)
    
    bti = ET.SubElement(form_root, "PartBTI")
    ET.SubElement(bti, "GrossTotalIncome").text = str(gross_salary)
    ET.SubElement(bti, "TotalIncome").text = str(taxable_income)
    
    deducs = ET.SubElement(bti, "DeductUndChapVIA")
    sec80c = tax_result.get("deduction_breakdown", {}).get("section_80c", 0)
    sec80d = tax_result.get("deduction_breakdown", {}).get("section_80d", 0)
    sec80ccd1b = tax_result.get("deduction_breakdown", {}).get("section_80ccd1b", 0)
    total_80 = sec80c + sec80d + sec80ccd1b
    
    ET.SubElement(deducs, "Section80C").text = str(sec80c)
    ET.SubElement(deducs, "Section80D").text = str(sec80d)
    ET.SubElement(deducs, "Section80CCD1B").text = str(sec80ccd1b)
    ET.SubElement(deducs, "TotalChapVIADeductions").text = str(total_80)
    
    # PartBTTI
    btti = ET.SubElement(form_root, "PartBTTI")
    tax_before_cess = tax_result.get("tax_before_cess", 0)
    cess = tax_result.get("cess", 0)
    total_tax = tax_result.get("total_tax", 0)
    tds = income_data.get("tds_deducted", 0)
    
    refund = max(0, tds - total_tax)
    balance = max(0, total_tax - tds)
    
    ET.SubElement(btti, "TaxPayable").text = str(tax_before_cess)
    ET.SubElement(btti, "Rebate87A").text = str(tax_result.get("rebate_87a", 0))
    ET.SubElement(btti, "HealthAndEduCess").text = str(cess)
    ET.SubElement(btti, "TotalTaxPayable").text = str(total_tax)
    ET.SubElement(btti, "TotalTaxPaid").text = str(tds)
    ET.SubElement(btti, "Refund").text = str(refund)
    ET.SubElement(btti, "BalTaxPayable").text = str(balance)
    ET.SubElement(btti, "RegimeOptedOld").text = "Y" if taxpayer.get("regime", "") == "old" else "N"
    
    # ScheduleS
    sched_s = ET.SubElement(form_root, "ScheduleS")
    
    employers = income_data.get("employers", [])
    if not employers:
        employers = [{
            "employer_name": taxpayer.get("employer_name", ""),
            "employer_tan": taxpayer.get("employer_tan", ""),
            "gross_salary": gross_salary
        }]
        
    std_deduction_remaining = tax_result.get("deduction_breakdown", {}).get("standard_deduction", 0)
    
    for emp_data in employers:
        emp = ET.SubElement(sched_s, "Employer")
        ET.SubElement(emp, "EmployerName").text = emp_data.get("employer_name", "")
        ET.SubElement(emp, "TAN").text = emp_data.get("employer_tan", "")
        
        emp_gross = emp_data.get("gross_salary", 0)
        # Add perquisite to the first employer's gross if not using multiple employers array
        if emp_data == employers[0] and "employers" not in income_data:
            emp_gross += income_data.get("esop_perquisite_value", 0)
            
        ET.SubElement(emp, "GrossSalary").text = str(emp_gross)
        ET.SubElement(emp, "PerquisitesVal").text = "0"
        ET.SubElement(emp, "ProfitsInSalary").text = "0"
        
        # Apply standard deduction to first employer
        emp_std_deduc = std_deduction_remaining
        std_deduction_remaining = 0
        
        ET.SubElement(emp, "StandardDeduction").text = str(emp_std_deduc)
        net_salary = max(0, emp_gross - emp_std_deduc)
        ET.SubElement(emp, "NetSalary").text = str(net_salary)
    
    exempt = ET.SubElement(sched_s, "AllwncExemptUs10")
    hra_ex = tax_result.get("deduction_breakdown", {}).get("hra_exemption", 0)
    ET.SubElement(exempt, "HRAExemption").text = str(hra_ex)
    
    # We use total gross salary minus standard deduction minus HRA
    total_net = gross_salary - tax_result.get("deduction_breakdown", {}).get("standard_deduction", 0)
    taxable_salary = max(0, total_net - hra_ex)
    ET.SubElement(sched_s, "TotIncUnderHeadSalaries").text = str(taxable_salary)
    
    # ScheduleTDS1
    tds_sched = ET.SubElement(form_root, "ScheduleTDS1")
    for emp_data in employers:
        tds_sal = ET.SubElement(tds_sched, "TDSonSal")
        ET.SubElement(tds_sal, "EmployerName").text = emp_data.get("employer_name", "")
        ET.SubElement(tds_sal, "TAN").text = emp_data.get("employer_tan", "")
        emp_gross = emp_data.get("gross_salary", 0)
        if emp_data == employers[0] and "employers" not in income_data:
            emp_gross += income_data.get("esop_perquisite_value", 0)
        ET.SubElement(tds_sal, "GrossSalPaid").text = str(emp_gross)
        
        # Find TDS for this employer
        if "employers" in income_data:
            emp_tds = emp_data.get("tds_deducted", 0)
        else:
            emp_tds = tds
        ET.SubElement(tds_sal, "TotalTDSSal").text = str(emp_tds)
    
    # ScheduleIT
    it_sched = ET.SubElement(form_root, "ScheduleIT")
    bank = ET.SubElement(it_sched, "BankAccount")
    ET.SubElement(bank, "IFSCCode").text = taxpayer.get("bank_ifsc", "")
    ET.SubElement(bank, "BankName").text = taxpayer.get("bank_name", "")
    ET.SubElement(bank, "BankAccountNo").text = taxpayer.get("bank_account", "")
    ET.SubElement(bank, "UseForRefund").text = "Y"
    
    # Verification
    ver = ET.SubElement(form_root, "Verification")
    dec = ET.SubElement(ver, "Declaration")
    ET.SubElement(dec, "AssesseeVerName").text = taxpayer.get("name", "")
    ET.SubElement(dec, "FatherName").text = ""
    ET.SubElement(dec, "AssesseeVerPAN").text = taxpayer.get("pan", "")
    ET.SubElement(dec, "Place").text = taxpayer.get("city", "")
    today_str = date.today().strftime("%d/%m/%Y")
    ET.SubElement(dec, "Date").text = today_str
    
    return itr_root

def generate_itr1_xml(taxpayer: dict, income_data: dict, tax_result: dict) -> str:
    root = _build_base_itr_tree("ITR1", taxpayer, income_data, tax_result)
    xml_str = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return xml_str

def generate_itr2_xml(taxpayer: dict, income_data: dict, tax_result: dict, cg_result: dict = None) -> str:
    root = _build_base_itr_tree("ITR2", taxpayer, income_data, tax_result)
    form_root = root.find("ITR2")
    
    if cg_result is None:
        cg_result = {
            "ltcg_equity_tax": 0,
            "stcg_equity_tax": 0,
            "total_cg_tax": 0,
            "exempt_ltcg_amount": 0
        }

    sched_cg = ET.SubElement(form_root, "ScheduleCGFor23")
    
    st_cap = ET.SubElement(sched_cg, "ShortTermCap")
    st_eq = ET.SubElement(st_cap, "EquityMFonSTT")
    st_mf = ET.SubElement(st_eq, "MFSales")
    ET.SubElement(st_mf, "FullValueSale").text = "0"
    ET.SubElement(st_mf, "DeductionUs48").text = "0"
    ET.SubElement(st_mf, "Balance").text = "0"
    ET.SubElement(st_eq, "CurrYearLoss").text = "0"
    ET.SubElement(st_eq, "TaxSTCG").text = str(cg_result.get("stcg_equity_tax", 0))
    
    lt_cap = ET.SubElement(sched_cg, "LongTermCap")
    lt_eq = ET.SubElement(lt_cap, "EquityMFonSTT")
    lt_mf = ET.SubElement(lt_eq, "MFSales")
    ET.SubElement(lt_mf, "Balance").text = "0"
    ET.SubElement(lt_eq, "ExemptionUs112A").text = str(cg_result.get("exempt_ltcg_amount", 0))
    ET.SubElement(lt_eq, "TaxLTCG").text = str(cg_result.get("ltcg_equity_tax", 0))
    
    ET.SubElement(sched_cg, "TotalLTCG").text = str(cg_result.get("ltcg_equity_tax", 0))
    ET.SubElement(sched_cg, "TotalSTCG").text = str(cg_result.get("stcg_equity_tax", 0))
    ET.SubElement(sched_cg, "TotalCGTax").text = str(cg_result.get("total_cg_tax", 0))
    
    sched_hp = ET.SubElement(form_root, "ScheduleHP")
    ET.SubElement(sched_hp, "TotalIncomeChargeableUnderHP").text = "0"
    sec24 = ET.SubElement(sched_hp, "Sec24")
    hp_int = tax_result.get("deduction_breakdown", {}).get("home_loan_interest_24b", 0)
    ET.SubElement(sec24, "InterestPayable").text = str(hp_int)
    
    if income_data.get("has_vda"):
        sched_vda = ET.SubElement(form_root, "ScheduleVDA")
        ET.SubElement(sched_vda, "VDAIncome").text = str(income_data.get("vda_gains", 0))
        # Find vda tax from result, compare_regimes adds it. Just grab it or recompute.
        # It's a flat 30%, so we can just recompute or get from tax_result (old_regime or new_regime)
        vda_tax = round(max(0, income_data.get("vda_gains", 0)) * 0.30)
        ET.SubElement(sched_vda, "TaxOnVDA").text = str(vda_tax)
        
    if income_data.get("has_foreign_assets") and income_data.get("foreign_assets"):
        sched_fa = ET.SubElement(form_root, "ScheduleFA")
        for fa in income_data.get("foreign_assets"):
            fa_el = ET.SubElement(sched_fa, "ForeignAsset")
            ET.SubElement(fa_el, "CountryName").text = fa.get("country", "")
            ET.SubElement(fa_el, "ZipCode").text = "00000"
            ET.SubElement(fa_el, "AccountNo").text = fa.get("account_no", "")
            ET.SubElement(fa_el, "PeakBalanceDuringYear").text = str(fa.get("peak_balance", 0))
            ET.SubElement(fa_el, "ClosingBalance").text = str(fa.get("closing_balance", 0))
            ET.SubElement(fa_el, "GrossInterestPaid").text = "0"
    
    xml_str = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return xml_str

def validate_xml(xml_str: str, form_type: str) -> list[str]:
    errors = []
    try:
        root = ET.fromstring(xml_str)
    except ET.ParseError:
        return ["Invalid XML structure"]
        
    req_tags = ["PAN", "Name", "DOB", "AssessmentYear", "TotalIncome", 
                "TotalTaxPayable", "IFSCCode", "BankAccountNo", "AssesseeVerPAN"]
                
    if form_type == "ITR2":
        req_tags.append("TotalCGTax")
    elif form_type == "ITR3":
        req_tags.extend(["ScheduleBP", "ProfitAndLoss"])
    elif form_type == "ITR4":
        req_tags.append("ScheduleBP")
        
    for tag in req_tags:
        if root.find(f".//{tag}") is None:
            errors.append(f"Missing tag: <{tag}>")
            
    return errors


# ── ITR-4 (Sugam) — Presumptive Income ───────────────────────────

def generate_itr4_xml(taxpayer: dict, income_data: dict, tax_result: dict, presumptive_result: dict = None) -> str:
    """Generate ITR-4 XML for presumptive income under 44AD / 44ADA / 44AE."""
    root = _build_base_itr_tree("ITR4", taxpayer, income_data, tax_result)
    form_root = root.find("ITR4")
    
    if presumptive_result is None:
        presumptive_result = {}
    
    # Schedule BP — Business or Profession (Presumptive)
    sched_bp = ET.SubElement(form_root, "ScheduleBP")
    
    scheme = income_data.get("presumptive_scheme", "44ADA")
    gross_receipts = income_data.get("gross_receipts", 0)
    
    if scheme == "44AD":
        # Section 44AD — Goods business (8% of turnover, 6% for digital receipts)
        sec44ad = ET.SubElement(sched_bp, "Sec44AD")
        ET.SubElement(sec44ad, "NatureOfBusiness").text = income_data.get("business_nature", "Trading")
        ET.SubElement(sec44ad, "GrossTurnover").text = str(gross_receipts)
        
        digital_receipts = income_data.get("digital_receipts", 0)
        cash_receipts = max(0, gross_receipts - digital_receipts)
        
        presumptive_digital = round(digital_receipts * 0.06)
        presumptive_cash = round(cash_receipts * 0.08)
        total_presumptive = presumptive_result.get("presumptive_income", presumptive_digital + presumptive_cash)
        
        ET.SubElement(sec44ad, "GrossReceiptsDigital").text = str(digital_receipts)
        ET.SubElement(sec44ad, "GrossReceiptsCash").text = str(cash_receipts)
        ET.SubElement(sec44ad, "PresumptiveIncomeDigital").text = str(presumptive_digital)
        ET.SubElement(sec44ad, "PresumptiveIncomeCash").text = str(presumptive_cash)
        ET.SubElement(sec44ad, "TotalPresumptiveIncome").text = str(total_presumptive)
        
    elif scheme == "44ADA":
        # Section 44ADA — Professionals (50% of gross receipts)
        sec44ada = ET.SubElement(sched_bp, "Sec44ADA")
        ET.SubElement(sec44ada, "NatureOfProfession").text = income_data.get("profession_type", "Professional Services")
        ET.SubElement(sec44ada, "GrossReceipts").text = str(gross_receipts)
        
        total_presumptive = presumptive_result.get("presumptive_income", round(gross_receipts * 0.50))
        ET.SubElement(sec44ada, "PresumptiveIncome").text = str(total_presumptive)
        
    elif scheme == "44AE":
        # Section 44AE — Goods carriage (₹7500 per vehicle per month)
        sec44ae = ET.SubElement(sched_bp, "Sec44AE")
        num_vehicles = income_data.get("num_vehicles", 1)
        months_operated = income_data.get("months_operated", 12)
        
        ET.SubElement(sec44ae, "NumberOfVehicles").text = str(num_vehicles)
        ET.SubElement(sec44ae, "MonthsOperated").text = str(months_operated)
        
        total_presumptive = presumptive_result.get("presumptive_income", num_vehicles * 7500 * months_operated)
        ET.SubElement(sec44ae, "PresumptiveIncome").text = str(total_presumptive)
    
    ET.SubElement(sched_bp, "ProfitFromBusiness").text = str(
        presumptive_result.get("presumptive_income", 0)
    )
    
    # Also add salary schedule if user has salary income too
    salary = income_data.get("gross_salary", 0)
    if salary > 0:
        sched_s = ET.SubElement(form_root, "ScheduleS")
        emp = ET.SubElement(sched_s, "Employer")
        ET.SubElement(emp, "EmployerName").text = taxpayer.get("employer_name", "")
        ET.SubElement(emp, "GrossSalary").text = str(salary)
        std_ded = tax_result.get("deduction_breakdown", {}).get("standard_deduction", 0)
        ET.SubElement(emp, "StandardDeduction").text = str(std_ded)
        ET.SubElement(emp, "NetSalary").text = str(max(0, salary - std_ded))
    
    xml_str = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return xml_str


# ── ITR-3 — Business / Profession (Non-Presumptive) ──────────────

def generate_itr3_xml(taxpayer: dict, income_data: dict, tax_result: dict, 
                      business_result: dict = None, cg_result: dict = None) -> str:
    """Generate ITR-3 XML for business/professional income with full P&L."""
    root = _build_base_itr_tree("ITR3", taxpayer, income_data, tax_result)
    form_root = root.find("ITR3")
    
    if business_result is None:
        business_result = {}
    
    # Schedule BP — Business or Profession
    sched_bp = ET.SubElement(form_root, "ScheduleBP")
    
    gross_receipts = income_data.get("gross_receipts", 0)
    business_expenses = income_data.get("business_expenses", 0)
    depreciation = income_data.get("depreciation", 0)
    net_profit = gross_receipts - business_expenses - depreciation
    
    ET.SubElement(sched_bp, "NatureOfBusiness").text = income_data.get("business_nature", "Business")
    ET.SubElement(sched_bp, "GrossTurnover").text = str(gross_receipts)
    ET.SubElement(sched_bp, "GrossReceipts").text = str(gross_receipts)
    ET.SubElement(sched_bp, "TotalExpenses").text = str(business_expenses)
    ET.SubElement(sched_bp, "Depreciation").text = str(depreciation)
    ET.SubElement(sched_bp, "NetProfit").text = str(net_profit)
    ET.SubElement(sched_bp, "ProfitFromBusiness").text = str(max(0, net_profit))
    
    # Profit & Loss Account
    pl = ET.SubElement(form_root, "ProfitAndLoss")
    ET.SubElement(pl, "Revenue").text = str(gross_receipts)
    
    expenses_el = ET.SubElement(pl, "Expenses")
    ET.SubElement(expenses_el, "PurchasesOfGoods").text = str(income_data.get("purchases", 0))
    ET.SubElement(expenses_el, "EmployeeBenefitExpense").text = str(income_data.get("employee_expense", 0))
    ET.SubElement(expenses_el, "RentExpense").text = str(income_data.get("office_rent", 0))
    ET.SubElement(expenses_el, "Depreciation").text = str(depreciation)
    ET.SubElement(expenses_el, "OtherExpenses").text = str(income_data.get("other_expenses", 0))
    ET.SubElement(expenses_el, "TotalExpenses").text = str(business_expenses)
    
    ET.SubElement(pl, "ProfitBeforeTax").text = str(net_profit)
    
    # Balance Sheet
    bs = ET.SubElement(form_root, "BalanceSheet")
    
    assets = ET.SubElement(bs, "Assets")
    ET.SubElement(assets, "FixedAssets").text = str(income_data.get("fixed_assets", 0))
    ET.SubElement(assets, "CurrentAssets").text = str(income_data.get("current_assets", 0))
    ET.SubElement(assets, "CashAndBank").text = str(income_data.get("cash_and_bank", 0))
    ET.SubElement(assets, "TotalAssets").text = str(
        income_data.get("fixed_assets", 0) + income_data.get("current_assets", 0) + income_data.get("cash_and_bank", 0)
    )
    
    liabilities = ET.SubElement(bs, "Liabilities")
    ET.SubElement(liabilities, "Capital").text = str(income_data.get("capital", 0))
    ET.SubElement(liabilities, "Reserves").text = str(income_data.get("reserves", 0))
    ET.SubElement(liabilities, "SecuredLoans").text = str(income_data.get("secured_loans", 0))
    ET.SubElement(liabilities, "UnsecuredLoans").text = str(income_data.get("unsecured_loans", 0))
    ET.SubElement(liabilities, "CurrentLiabilities").text = str(income_data.get("current_liabilities", 0))
    
    # Schedule Depreciation
    if depreciation > 0:
        sched_dep = ET.SubElement(form_root, "ScheduleDepreciation")
        ET.SubElement(sched_dep, "WDVBeginning").text = str(income_data.get("wdv_opening", 0))
        ET.SubElement(sched_dep, "AdditionsDuringYear").text = str(income_data.get("asset_additions", 0))
        ET.SubElement(sched_dep, "DepreciationAmount").text = str(depreciation)
        ET.SubElement(sched_dep, "WDVClosing").text = str(
            income_data.get("wdv_opening", 0) + income_data.get("asset_additions", 0) - depreciation
        )
    
    # Capital Gains (if any)
    if cg_result:
        sched_cg = ET.SubElement(form_root, "ScheduleCGFor23")
        st_cap = ET.SubElement(sched_cg, "ShortTermCap")
        st_eq = ET.SubElement(st_cap, "EquityMFonSTT")
        ET.SubElement(st_eq, "TaxSTCG").text = str(cg_result.get("stcg_equity_tax", 0))
        lt_cap = ET.SubElement(sched_cg, "LongTermCap")
        lt_eq = ET.SubElement(lt_cap, "EquityMFonSTT")
        ET.SubElement(lt_eq, "TaxLTCG").text = str(cg_result.get("ltcg_equity_tax", 0))
        ET.SubElement(sched_cg, "TotalCGTax").text = str(cg_result.get("total_cg_tax", 0))
    
    # Foreign Assets
    if income_data.get("has_foreign_assets") and income_data.get("foreign_assets"):
        sched_fa = ET.SubElement(form_root, "ScheduleFA")
        for fa in income_data.get("foreign_assets"):
            fa_el = ET.SubElement(sched_fa, "ForeignAsset")
            ET.SubElement(fa_el, "CountryName").text = fa.get("country", "")
            ET.SubElement(fa_el, "PeakBalanceDuringYear").text = str(fa.get("peak_balance", 0))
    
    xml_str = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return xml_str


# ── Smart ITR Form Selector ──────────────────────────────────────

def select_itr_form(income_data: dict) -> str:
    """
    Deterministically selects the correct ITR form based on income profile.
    Returns one of: ITR1, ITR2, ITR3, ITR4, ITR5, ITR6, ITR7
    """
    entity_type = income_data.get("entity_type", "individual")
    
    # Entity-level routing (non-individual)
    if entity_type == "company":
        return "ITR6"
    if entity_type in ("trust", "political_party", "research_institution"):
        return "ITR7"
    if entity_type in ("firm", "llp", "aop", "boi"):
        return "ITR5"
    
    # Individual / HUF routing
    has_business = (
        income_data.get("is_freelancer", False) or 
        income_data.get("gross_receipts", 0) > 0 or
        income_data.get("has_business_income", False)
    )
    
    if has_business:
        gross_receipts = income_data.get("gross_receipts", 0)
        total_income = income_data.get("gross_salary", 0) + gross_receipts
        
        # Check if eligible for presumptive (44AD: ₹3Cr for digital, 44ADA: ₹75L)
        scheme = income_data.get("presumptive_scheme", "")
        is_presumptive = income_data.get("use_presumptive", False)
        
        if scheme == "44AD" and gross_receipts > 30000000:
            is_presumptive = False
        elif scheme == "44ADA" and gross_receipts > 7500000:
            is_presumptive = False
        elif scheme == "44AE":
            is_presumptive = True  # 44AE is always presumptive
        elif not scheme and gross_receipts <= 7500000:
            is_presumptive = True  # Default to presumptive if under limit
        
        if is_presumptive and total_income <= 5000000:
            return "ITR4"
        else:
            return "ITR3"
    
    # Salaried / investment income only
    has_cg = income_data.get("has_capital_gains", False)
    has_fa = income_data.get("has_foreign_assets", False)
    has_vda = income_data.get("has_vda", False)
    multi_hp = income_data.get("num_properties", 1) > 1
    total_income = income_data.get("gross_salary", 0)
    has_other_sources = (
        income_data.get("fd_interest", 0) > 0 or
        income_data.get("dividend_income", 0) > 0
    )
    
    if has_cg or has_fa or has_vda or multi_hp or total_income > 5000000:
        return "ITR2"
    
    return "ITR1"

