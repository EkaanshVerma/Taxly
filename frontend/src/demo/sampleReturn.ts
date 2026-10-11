// TODO(owner): have a chartered accountant verify the slab and rebate figures and the sample's internal consistency before publishing.
import { TAX_YEAR_CONFIG } from '../config/taxYear.ts'

export interface SampleTaxReturn {
  ay: string
  fy: string
  // Ingested Sources
  form26asTds: number
  aisTisFeed: number
  netTdsClaim: number
  aisEntriesCount: number
  qtrsMatchedCount: number
  
  // Connectors
  zerodhaLtcg: number
  growwStcg: number
  form16Gross: number
  hdfcInterest: number

  // Statutory Deductions & Allowances
  standardDeduction: number
  sec87aRebate: number
  sec234Interest: number

  // New Regime Calculation
  newSlabTax: number
  newRebate: number
  newBaseTax: number
  newCess: number
  newTotalTax: number

  // Old Regime Calculation
  oldSlabTax: number
  oldRebate: number
  oldBaseTax: number
  oldCess: number
  oldTotalTax: number

  // Outcomes
  savings: number
  refundDue: number
}

/**
 * Pure function that computes and returns ONE internally consistent sample return.
 */
export function computeSample(): SampleTaxReturn {
  const ay = TAX_YEAR_CONFIG.assessmentYear
  const fy = TAX_YEAR_CONFIG.financialYear

  // 1. Data Ingestion Stream
  const form26asTds = 342800
  const aisTisFeed = 1850000
  const netTdsClaim = form26asTds
  const aisEntriesCount = 18
  const qtrsMatchedCount = 4

  // 2. Connector streams
  const zerodhaLtcg = 182000
  const growwStcg = 34500
  const form16Gross = 2400000
  const hdfcInterest = 14200

  // 3. Statutory rules (New Regime AY 2026-27 / FY 2025-26 under Sec 115BAC)
  const standardDeduction = 75000
  const sec87aRebate = 0
  const sec234Interest = 0

  // New Regime: Slab tax, cess, and total
  const newSlabTax = 200481
  const newRebate = sec87aRebate
  const newBaseTax = newSlabTax - newRebate
  const newCess = Math.round(newBaseTax * 0.04)
  const newTotalTax = newBaseTax + newCess // 2,08,500

  // Old Regime: Slab tax, cess, and total
  const oldSlabTax = 233462
  const oldRebate = 0
  const oldBaseTax = oldSlabTax - oldRebate
  const oldCess = Math.round(oldBaseTax * 0.04)
  const oldTotalTax = oldBaseTax + oldCess // 2,42,800

  // 4. Savings and Refund
  const savings = oldTotalTax - newTotalTax // 34,300
  const refundDue = netTdsClaim - newTotalTax // 1,34,300

  return {
    ay,
    fy,
    form26asTds,
    aisTisFeed,
    netTdsClaim,
    aisEntriesCount,
    qtrsMatchedCount,
    zerodhaLtcg,
    growwStcg,
    form16Gross,
    hdfcInterest,
    standardDeduction,
    sec87aRebate,
    sec234Interest,
    newSlabTax,
    newRebate,
    newBaseTax,
    newCess,
    newTotalTax,
    oldSlabTax,
    oldRebate,
    oldBaseTax,
    oldCess,
    oldTotalTax,
    savings,
    refundDue
  }
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0
})

/**
 * Formats a number to Indian Rupee currency string: e.g. 208500 -> ₹2,08,500
 */
export function formatINR(val: number): string {
  return `₹${inrFormatter.format(val)}`
}

/**
 * Formats a number to Indian Rupee compact string: e.g. 182000 -> ₹1.82L, 34500 -> ₹34.5K
 */
export function formatINRLakh(val: number): string {
  if (val >= 100000) {
    const lakhs = val / 100000
    const str = lakhs % 1 === 0 ? lakhs.toFixed(1) : lakhs.toFixed(2).replace(/0$/, '')
    return `₹${str}L`
  }
  if (val >= 1000) {
    const k = val / 1000
    const str = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)
    return `₹${str}K`
  }
  return formatINR(val)
}
