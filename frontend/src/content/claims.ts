// TODO(owner): confirm each claim before flipping verified to true.
import { TAX_YEAR_CONFIG } from '../config/taxYear.ts'

export interface ClaimItem {
  unverified: string
  fallback: string
  verified: boolean
}

export const CLAIMS = {
  zeroHallucination: {
    unverified: 'Zero LLM Hallucination',
    fallback: 'Tax computed by a rules engine',
    verified: false
  },
  statutoryUnitTests: {
    unverified: '134 Statutory Unit Tests Passed',
    fallback: 'Statutory rules checked',
    verified: false
  },
  unitTestsPassedChip: {
    unverified: '134 Unit Tests Passed',
    fallback: 'Statutory rules checked',
    verified: false
  },
  zeroDiscrepancy: {
    unverified: '0 DISCREPANCY',
    fallback: 'Reconciled in this sample',
    verified: false
  },
  eligibleCredits: {
    unverified: '100% Eligible',
    fallback: 'Eligible in this sample',
    verified: false
  },
  caSignOff: {
    unverified: 'ICAI CA Sign-Off',
    fallback: 'Reviewed by a chartered accountant',
    verified: false
  },
  gatewayVerified: {
    unverified: 'ITD Gateway Verified',
    fallback: 'Prepared for e-filing',
    verified: false
  },
  itrAck: {
    unverified: 'Instant ITR-V Ack',
    fallback: 'ITR-V acknowledgement',
    verified: false
  },
  rulesEngine: {
    unverified: `Live CBDT ${TAX_YEAR_CONFIG.assessmentYear} Engine`,
    fallback: `Rules for AY ${TAX_YEAR_CONFIG.ay}`,
    verified: false
  },
  itr2Verified: {
    unverified: 'ITR-2 Verified',
    fallback: 'ITR-2 · sample',
    verified: false
  },
  submissionDescription: {
    unverified: 'Final verification by chartered accountants, generation of valid ITR JSON/XML, and direct submission to the ITD portal.',
    fallback: 'Final verification by chartered accountants, generation of valid ITR JSON/XML, and preparation for submission on the Income Tax portal.',
    verified: false
  },
  deterministicDescription: {
    unverified: 'Runs 130+ unit-tested statutory rules with zero LLM hallucination in arithmetic or tax slab bracket thresholds.',
    fallback: 'Runs statutory tax rules with arithmetic and tax slab bracket thresholds computed by a deterministic engine.',
    verified: false
  },
  caCertifiedTitle: {
    unverified: 'CA Certified & ITD Gateway Ready',
    fallback: 'CA Reviewed & Submission Ready',
    verified: false
  }
} as const

export type ClaimKey = keyof typeof CLAIMS

/**
 * Returns the verified claim string if verified is true, otherwise the safe fallback.
 */
export function getClaim(key: ClaimKey): string {
  const claim = CLAIMS[key]
  return claim.verified ? claim.unverified : claim.fallback
}
