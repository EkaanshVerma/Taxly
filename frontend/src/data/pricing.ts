/**
 * @file pricing.ts
 * TypeScript re-export and type definitions for Taxly pricing data model.
 */

export interface Price {
  amount: number | null
  unit: string
  note?: string
}

export interface CTA {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export interface Plan {
  id: string
  name: string
  tagline: string // Tagline with one **bolded phrase**
  price: Price
  cta: CTA
  highlighted?: boolean
  badge?: string
}

export interface Category {
  id: string
  name: string
  description: string
}

export type FeatureValue = boolean | string | number | 'on-demand' | 'available'

export interface Feature {
  id: string
  categoryId: string
  name: string
  description: string
  values: Record<string, FeatureValue>
}

export interface AddOn {
  id: string
  title: string
  description: string
  bullets: string[]
  cta: {
    label: string
    href: string
  }
}

export interface PricingFAQItem {
  q: string
  a: string
}

export {
  CATEGORIES,
  INDIVIDUAL_PLANS,
  CA_PLANS,
  INDIVIDUAL_FEATURES,
  CA_FEATURES,
  ADD_ONS,
  PRICING_FAQ
} from './pricing.js'
