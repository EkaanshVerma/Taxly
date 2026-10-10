/**
 * @file pricing.js
 * Single source of truth for Taxly pricing data:
 * - Plans for Individuals and CAs/Firms
 * - Category groups
 * - Feature rows for comparison table and plan cards
 * - On-demand products (Add-ons)
 * - Pricing FAQ items
 */

export const CATEGORIES = [
  {
    id: 'interview',
    name: 'Interview',
    description: 'Plain-English questions that learn your situation.'
  },
  {
    id: 'ingest',
    name: 'Ingest',
    description: 'Reads every certificate and statement you upload.'
  },
  {
    id: 'analyse',
    name: 'Analyse',
    description: 'Flags every rupee that needs explaining.'
  },
  {
    id: 'verify',
    name: 'Verify',
    description: 'A chartered accountant signs off before you file.'
  },
  {
    id: 'firm-controls',
    name: 'Firm Controls',
    description: 'Standards, permissions and support at scale.'
  }
]

export const INDIVIDUAL_PLANS = [
  {
    id: 'essentials',
    name: 'Self-file',
    tagline: 'Complete, automated filing for **salaried individuals.**',
    price: {
      amount: 199,
      unit: '/year',
      note: 'One employer · Salary income · Standard deductions'
    },
    cta: {
      label: 'Start self-filing →',
      href: '/login?plan=self-file',
      variant: 'secondary'
    },
    highlighted: false
  },
  {
    id: 'plus',
    name: 'AI + CA verified',
    tagline: 'Bank statement analysed, **every flag checked by a CA** against real evidence.',
    price: {
      amount: 999,
      unit: '/year',
      note: 'Most filed · Capital gains, multiple employers & rent'
    },
    cta: {
      label: 'Get CA verification →',
      href: '/login?plan=ca-verified',
      variant: 'primary'
    },
    highlighted: true,
    badge: 'Most filed'
  },
  {
    id: 'advanced',
    name: 'Full advisory',
    tagline: 'For **business income, property sales, NRI returns** and multi-year planning.',
    price: {
      amount: 1999,
      unit: '/year',
      note: 'Includes 1-on-1 direct CA advisory & notice review'
    },
    cta: {
      label: 'Talk to a CA →',
      href: '/login?plan=full-advisory',
      variant: 'secondary'
    },
    highlighted: false
  },
  {
    id: 'enterprise-ind',
    name: 'Enterprise / CA Firm',
    tagline: 'Our **most comprehensive offering** for firms managing many client returns.',
    price: {
      amount: null,
      unit: '',
      note: 'Custom volume quotas · Dedicated SLA'
    },
    cta: {
      label: 'Contact Us',
      href: '/for-cas#request-access',
      variant: 'secondary'
    },
    highlighted: false
  }
]

export const CA_PLANS = [
  {
    id: 'starter-firm',
    name: 'Starter Practice',
    tagline: 'For **independent practitioners** managing up to 25 client returns.',
    price: {
      amount: 2499,
      unit: '/month',
      note: 'Up to 25 client returns included'
    },
    cta: {
      label: 'Start free trial →',
      href: '/for-cas#request-access?plan=starter-firm',
      variant: 'secondary'
    },
    highlighted: false
  },
  {
    id: 'growth-firm',
    name: 'Growth Firm',
    tagline: 'For **growing CA partnerships** with collaborative reviews and queues.',
    price: {
      amount: 5999,
      unit: '/month',
      note: 'Up to 100 client returns · 5 partner/staff seats'
    },
    cta: {
      label: 'Start free trial →',
      href: '/for-cas#request-access?plan=growth-firm',
      variant: 'primary'
    },
    highlighted: true,
    badge: 'Most popular'
  },
  {
    id: 'established-firm',
    name: 'Established Firm',
    tagline: 'For **multi-branch practices** needing dedicated throughput and audit trails.',
    price: {
      amount: 14999,
      unit: '/month',
      note: 'Up to 500 client returns · 20 partner/staff seats'
    },
    cta: {
      label: 'Start free trial →',
      href: '/for-cas#request-access?plan=established-firm',
      variant: 'secondary'
    },
    highlighted: false
  },
  {
    id: 'enterprise-firm',
    name: 'Enterprise Firm',
    tagline: 'Our **enterprise governance suite** for large audit networks & syndicates.',
    price: {
      amount: null,
      unit: '',
      note: 'Unlimited clients & custom practice SLA'
    },
    cta: {
      label: 'Contact Us',
      href: '/for-cas#request-access?plan=enterprise-firm',
      variant: 'secondary'
    },
    highlighted: false
  }
]

/**
 * 22 Comparison features grouped across the 5 categories.
 */
export const INDIVIDUAL_FEATURES = [
  // ─── 1. Interview ──────────────────────────────────────────────────────────
  {
    id: 'feat-conversational-interview',
    categoryId: 'interview',
    name: 'Conversational ITR Interview',
    description: 'Plain-language tax interview that asks only what applies to you.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-regime-optimizer',
    categoryId: 'interview',
    name: 'Old vs New Regime Simulator',
    description: 'Side-by-side tax comparison computing optimal deductions.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-multi-employer-merge',
    categoryId: 'interview',
    name: 'Multi-Employer Switching Assistant',
    description: 'Consolidates overlapping salary periods and aggregates TDS slabs.',
    values: { essentials: false, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-freelance-presumptive',
    categoryId: 'interview',
    name: 'Section 44ADA Presumptive Wizard',
    description: 'Dedicated interview branch for 50% gross receipts income under 44ADA.',
    values: { essentials: false, plus: false, advanced: true, 'enterprise-ind': true }
  },

  // ─── 2. Ingest ────────────────────────────────────────────────────────────
  {
    id: 'feat-form16-parse',
    categoryId: 'ingest',
    name: 'Form 16 PDF Parser',
    description: 'Extracts Part A & Part B employer certificates directly.',
    values: { essentials: '1 Form 16', plus: 'Up to 5', advanced: 'Unlimited', 'enterprise-ind': 'Unlimited' }
  },
  {
    id: 'feat-ais-26as-recon',
    categoryId: 'ingest',
    name: 'AIS & Form 26AS Reconciliation',
    description: 'Cross-checks reported TDS against official ITD tax ledger records.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-broker-pnl-import',
    categoryId: 'ingest',
    name: 'Broker P&L & Capital Gains Summary',
    description: 'Direct ingestion of Zerodha, Groww, and Upstox annual reports.',
    values: { essentials: false, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-bank-statement-doc-limit',
    categoryId: 'ingest',
    name: 'Linked Document Processing',
    description: 'Total number of uploaded financial certificates and statements.',
    values: { essentials: 10, plus: 25, advanced: 50, 'enterprise-ind': 'Unlimited' }
  },
  {
    id: 'feat-foreign-assets-schedule-fa',
    categoryId: 'ingest',
    name: 'Foreign Assets & Schedule FA Ingest',
    description: 'Processes US brokerage statements (ESOP/RSU) with SBI TT rates.',
    values: { essentials: false, plus: false, advanced: true, 'enterprise-ind': true }
  },

  // ─── 3. Analyse ───────────────────────────────────────────────────────────
  {
    id: 'feat-deduction-scanner',
    categoryId: 'analyse',
    name: 'Chapter VI-A Deduction Scanner',
    description: 'Screens 80C, 80D, 80CCD(1B), and 80G eligibility from proof.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-bank-statement-ai',
    categoryId: 'analyse',
    name: 'Bank Statement Analysis',
    description: 'Classifies high-value deposits, insurance debits, and interest credits.',
    values: { essentials: false, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-grandfathering-ltcg',
    categoryId: 'analyse',
    name: 'LTCG Jan-2018 Grandfathering Rules',
    description: 'Applies FMV as of 31 Jan 2018 for Section 112A equity gains.',
    values: { essentials: false, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-dtaa-treaty-relief',
    categoryId: 'analyse',
    name: 'DTAA Section 90/91 Relief Engine',
    description: 'Calculates foreign tax credits against Indian tax liability.',
    values: { essentials: false, plus: false, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-crypto-flat-30',
    categoryId: 'analyse',
    name: 'Crypto & VDA Section 115BBH Engine',
    description: 'Applies flat 30% rate with statutory restriction on loss set-off.',
    values: { essentials: false, plus: false, advanced: true, 'enterprise-ind': true }
  },

  // ─── 4. Verify ────────────────────────────────────────────────────────────
  {
    id: 'feat-deterministic-engine',
    categoryId: 'verify',
    name: 'Deterministic Python Tax Engine',
    description: 'Zero-hallucination arithmetic verified against CBDT test suites.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-itr-xml-export',
    categoryId: 'verify',
    name: 'Ready-to-Upload ITR XML & JSON',
    description: 'Validated schema export ready for official Income Tax portal.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-ca-manual-review',
    categoryId: 'verify',
    name: 'Chartered Accountant Pre-File Sign-off',
    description: 'A licensed CA reviews every flagged deduction before return unlock.',
    values: { essentials: false, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-1on1-consultation',
    categoryId: 'verify',
    name: '1-on-1 Direct CA Video Advisory',
    description: '30-minute private consultation for complex capital restructuring.',
    values: { essentials: false, plus: 'on-demand', advanced: '30 min included', 'enterprise-ind': 'available' }
  },
  {
    id: 'feat-notice-defense-assist',
    categoryId: 'verify',
    name: 'Section 143(1) Notice Reply Assistance',
    description: 'Structured assistance for routine processing intimations.',
    values: { essentials: 'on-demand', plus: 'on-demand', advanced: true, 'enterprise-ind': true }
  },

  // ─── 5. Firm Controls ─────────────────────────────────────────────────────
  {
    id: 'feat-data-encryption',
    categoryId: 'firm-controls',
    name: 'Zero-Knowledge At-Rest Encryption',
    description: 'AES-256 encrypted documents with optional one-click permanent wipe.',
    values: { essentials: true, plus: true, advanced: true, 'enterprise-ind': true }
  },
  {
    id: 'feat-support-sla',
    categoryId: 'firm-controls',
    name: 'Customer Support Response SLA',
    description: 'Guaranteed turnaround time for platform queries.',
    values: { essentials: '48 hours', plus: '24 hours', advanced: '4 hours priority', 'enterprise-ind': 'Dedicated Rep' }
  },
  {
    id: 'feat-firm-roster-access',
    categoryId: 'firm-controls',
    name: 'Multi-User & Enterprise Firm Roster',
    description: 'Seat assignment, role permissions, and central client dispatching.',
    values: { essentials: false, plus: false, advanced: false, 'enterprise-ind': true }
  }
]

export const CA_FEATURES = [
  // ─── 1. Interview ──────────────────────────────────────────────────────────
  {
    id: 'ca-feat-client-interview-link',
    categoryId: 'interview',
    name: 'White-Label Client Interview Portal',
    description: 'Clients fill plain-English questionnaire on your branded link.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-custom-questionnaire',
    categoryId: 'interview',
    name: 'Custom Questionnaire Templates',
    description: 'Tailor deduction questions for specific client professions.',
    values: { 'starter-firm': false, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-itr3-itr4-workflows',
    categoryId: 'interview',
    name: 'ITR-3 & ITR-4 Business Modules',
    description: 'Supports Balance Sheet, P&L, 44AD/44ADA, and GST reconciliation.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },

  // ─── 2. Ingest ────────────────────────────────────────────────────────────
  {
    id: 'ca-feat-bulk-doc-upload',
    categoryId: 'ingest',
    name: 'Bulk Client Document Upload',
    description: 'Drag-and-drop client ZIP or automated cloud sync drive.',
    values: { 'starter-firm': '25 clients', 'growth-firm': '100 clients', 'established-firm': '500 clients', 'enterprise-firm': 'Unlimited' }
  },
  {
    id: 'ca-feat-bank-statement-ocr',
    categoryId: 'ingest',
    name: 'Bank Statement OCR & Reconciliation',
    description: 'Direct parser across 40+ Indian private and public sector banks.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-multi-broker-aggregator',
    categoryId: 'ingest',
    name: 'Multi-Broker Capital Gains Parser',
    description: 'Merges transactions from Zerodha, Groww, ICICI Direct, and AngelOne.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },

  // ─── 3. Analyse ───────────────────────────────────────────────────────────
  {
    id: 'ca-feat-discrepancy-scoring',
    categoryId: 'analyse',
    name: 'Automated Discrepancy Risk Scoring',
    description: 'Flags transactions with high variance vs 26AS/AIS declarations.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-cross-regime-calc',
    categoryId: 'analyse',
    name: 'Instant Regime Variance Reports',
    description: 'One-click client PDF showing optimal regime deduction breakdown.',
    values: { 'starter-firm': true, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-foreign-tax-schedules',
    categoryId: 'analyse',
    name: 'Schedule FA & Form 67 Calculation',
    description: 'Automates Foreign Tax Credit computations across DTAA partner states.',
    values: { 'starter-firm': false, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },

  // ─── 4. Verify ────────────────────────────────────────────────────────────
  {
    id: 'ca-feat-ca-review-queue',
    categoryId: 'verify',
    name: 'Partner Review & Sign-Off Queue',
    description: 'Assign junior associates to draft; partners sign off before XML release.',
    values: { 'starter-firm': 'Single user', 'growth-firm': 'Up to 5 seats', 'established-firm': 'Up to 20 seats', 'enterprise-firm': 'Unlimited' }
  },
  {
    id: 'ca-feat-bulk-xml-generation',
    categoryId: 'verify',
    name: 'Batch ITR XML / JSON Generation',
    description: 'Export all approved filings in one structured archive.',
    values: { 'starter-firm': false, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-notice-resolution-suite',
    categoryId: 'verify',
    name: 'Notice Resolution & Hearing Assistant',
    description: 'Pre-drafted legal replies for section 139(9), 143(1), and 148 notices.',
    values: { 'starter-firm': 'on-demand', 'growth-firm': 'available', 'established-firm': true, 'enterprise-firm': true }
  },

  // ─── 5. Firm Controls ─────────────────────────────────────────────────────
  {
    id: 'ca-feat-role-based-access',
    categoryId: 'firm-controls',
    name: 'Role-Based Access Control (RBAC)',
    description: 'Granular permissions for Articled Assistants, Reviewers, and Partners.',
    values: { 'starter-firm': false, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-audit-trail-logs',
    categoryId: 'firm-controls',
    name: 'Immutable Audit Trail & Activity Logs',
    description: 'Detailed tamper-evident logs for all data edits and downloads.',
    values: { 'starter-firm': false, 'growth-firm': true, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-sso-saml',
    categoryId: 'firm-controls',
    name: 'Single Sign-On (SSO / SAML)',
    description: 'Integrates with Google Workspace, Microsoft Entra ID, or Okta.',
    values: { 'starter-firm': false, 'growth-firm': false, 'established-firm': true, 'enterprise-firm': true }
  },
  {
    id: 'ca-feat-support-sla-firm',
    categoryId: 'firm-controls',
    name: 'Firm Support SLA & Training',
    description: 'Dedicated relationship manager and team onboarding session.',
    values: { 'starter-firm': 'Standard email', 'growth-firm': 'Priority chat', 'established-firm': 'Dedicated Partner', 'enterprise-firm': '1-Hour SLA' }
  }
]

export const ADD_ONS = [
  {
    id: 'notice-reply-assistant',
    title: 'Notice Reply Assistant',
    description: 'Draft AI-assisted, CA-reviewed responses to Section 143(1) and 139(9) defect notices without panic.',
    bullets: [
      'Automated discrepancy clause extraction from ITD PDF notices',
      'Pre-populated legal citation templates & computational rectifications',
      'Final Chartered Accountant verification before e-proceedings upload'
    ],
    cta: {
      label: 'Explore Add-on →',
      href: '/login?addon=notice-assistant'
    }
  },
  {
    id: 'past-year-rectification',
    title: 'Past-Year Rectification / Revised Return',
    description: 'File revised returns or Section 154 rectifications for previous assessment years with full delta reconciliation.',
    bullets: [
      'Comparison against original filed ITR acknowledgment receipt',
      'TDS credit mismatch correction & delayed interest recalculation',
      'Complete audit trail of all amended heads and schedule changes'
    ],
    cta: {
      label: 'Explore Add-on →',
      href: '/login?addon=past-year-rectification'
    }
  }
]

export const PRICING_FAQ = [
  {
    q: 'How does pay-on-download work?',
    a: 'You can complete your entire interview, upload Form 16s, and review your tax liability breakdown completely free. You only pay when you are ready to download your finalized, validated ITR XML/JSON or submit it for Chartered Accountant sign-off.'
  },
  {
    q: 'Do I need a credit card to get started?',
    a: 'No card is required. You can sign up with your email or phone number and start drafting your return immediately without entering any payment information.'
  },
  {
    q: 'Is my data stored or shared with any third parties?',
    a: 'Your PAN, salary details, and financial statements are strictly encrypted using AES-256 at rest and TLS 1.3 in transit. We never sell, rent, or share your data with advertisers or loan brokers. You retain full control and can permanently wipe your documents at any time from your settings.'
  },
  {
    q: 'What does the Chartered Accountant actually verify?',
    a: 'On verified tiers, a licensed Chartered Accountant reviews all flagged deductions, checks bank statement classifications against claimed Chapter VI-A proofs, verifies grandfathered capital gains calculations, and ensures no schedule errors exist before releasing your filing package.'
  },
  {
    q: 'Can I switch or upgrade my plan midway?',
    a: 'Yes. If you start on the Self-file tier and realize you have unexpected capital gains or want a CA to review a complex entry, you can seamlessly upgrade to AI + CA verified or Full advisory at any time before downloading your return.'
  },
  {
    q: 'What happens if the Assessment Year changes?',
    a: 'All plans cover one financial year filing. You retain lifetime access to view and download the ITR XML, computation summary, and documents for every assessment year you complete with Taxly.'
  },
  {
    q: 'What is your refund policy if my return cannot be processed?',
    a: 'If our deterministic calculation engine produces an arithmetic defect caused by a platform error, or if our CA review cannot unlock your return, we offer a 100% money-back guarantee within 7 days of purchase.'
  },
  {
    q: 'Are government taxes (GST) included in the prices?',
    a: 'All displayed rates are subject to applicable Goods and Services Tax (18% GST). Full GST tax invoices with your business GSTIN are provided on payment.'
  },
  {
    q: 'How do CA firm seats and client quotas work?',
    a: 'CA plans are configured around active partner/associate seats and annual filing quotas. Growth and Established tiers allow team members to collaborate on client returns with granular role-based permissions.'
  },
  {
    q: 'Is there a free tier to test the platform?',
    a: 'Yes! Anyone can test our Form 16 parser, compare Old vs New tax regimes, and explore the conversational interview at no cost before making a purchase decision.'
  },
  {
    q: 'How does notice assistance work if the Income Tax Department issues an inquiry?',
    a: 'On Full advisory and CA-verified tiers, our team and your assigned CA help you understand Section 143(1) intimation adjustments or Section 139(9) defective return notices and provide pre-drafted response schedules.'
  }
]
