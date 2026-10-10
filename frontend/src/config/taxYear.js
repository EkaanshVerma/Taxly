// TODO(owner): verify AY and due dates against incometax.gov.in
// Centralized configuration for Assessment Year, Financial Year, and statutory filing deadlines.

export const TAX_YEAR_CONFIG = {
  assessmentYear: 'AY 2026–27',
  financialYear: 'FY 2025–26',
  filingDeadline: 'July 31, 2026',
  announcementText: 'Filing season is open for AY 2026–27.',
  announcementCta: 'See what it costs →'
}

export const CURRENT_AY = TAX_YEAR_CONFIG.assessmentYear
export const CURRENT_FY = TAX_YEAR_CONFIG.financialYear
export const FILING_DEADLINE = TAX_YEAR_CONFIG.filingDeadline
