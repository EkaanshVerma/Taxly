import test from 'node:test'
import assert from 'node:assert/strict'
import { computeSample, formatINR, formatINRLakh } from './sampleReturn.ts'

test('computeSample derives mathematically consistent tax figures', () => {
  const sample = computeSample()

  // 1. Cess calculation: cess = 4% of (slab_tax − rebate)
  const expectedNewCess = Math.round(0.04 * (sample.newSlabTax - sample.newRebate))
  assert.equal(
    sample.newCess,
    expectedNewCess,
    `New Cess must be 4% of (slab_tax - rebate): expected ${expectedNewCess}, got ${sample.newCess}`
  )

  // 2. Total tax: total_tax = slab_tax − rebate + cess
  const expectedNewTotal = sample.newSlabTax - sample.newRebate + sample.newCess
  assert.equal(
    sample.newTotalTax,
    expectedNewTotal,
    `New Total tax must equal slab_tax - rebate + cess: expected ${expectedNewTotal}, got ${sample.newTotalTax}`
  )

  // Old regime total tax consistency
  const expectedOldCess = Math.round(0.04 * (sample.oldSlabTax - sample.oldRebate))
  assert.equal(sample.oldCess, expectedOldCess)
  const expectedOldTotal = sample.oldSlabTax - sample.oldRebate + sample.oldCess
  assert.equal(sample.oldTotalTax, expectedOldTotal)

  // 3. Savings: savings = old_total − new_total
  const expectedSavings = sample.oldTotalTax - sample.newTotalTax
  assert.equal(
    sample.savings,
    expectedSavings,
    `Savings must equal old_total - new_total: expected ${expectedSavings}, got ${sample.savings}`
  )
  assert.equal(sample.savings, 34300, 'Savings must be ₹34,300')

  // 4. Refund: refund = TDS − total_tax
  const expectedRefund = sample.netTdsClaim - sample.newTotalTax
  assert.equal(
    sample.refundDue,
    expectedRefund,
    `Refund must equal TDS - total_tax: expected ${expectedRefund}, got ${sample.refundDue}`
  )
  assert.equal(sample.refundDue, 134300, 'Refund due must be ₹1,34,300')

  // Verify display numbers
  assert.equal(sample.oldTotalTax, 242800, 'Old tax must be ₹2,42,800')
  assert.equal(sample.newTotalTax, 208500, 'New tax must be ₹2,08,500')
  assert.equal(sample.netTdsClaim, 342800, 'TDS must be ₹3,42,800')
})

test('formatINR formats currency according to en-IN system', () => {
  assert.equal(formatINR(242800), '₹2,42,800')
  assert.equal(formatINR(208500), '₹2,08,500')
  assert.equal(formatINR(34300), '₹34,300')
  assert.equal(formatINR(134300), '₹1,34,300')
  assert.equal(formatINR(75000), '₹75,000')
})

test('formatINRLakh formats compact units properly', () => {
  assert.equal(formatINRLakh(182000), '₹1.82L')
  assert.equal(formatINRLakh(34500), '₹34.5K')
  assert.equal(formatINRLakh(2400000), '₹24.0L')
  assert.equal(formatINRLakh(14200), '₹14.2K')
})
