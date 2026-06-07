import { PRODUCT_CATEGORIES } from '@/lib/constants'

export type SocialProofLabel = 'Best Seller' | 'Top Rated'

export type ConversionLabel = 'New Arrival' | 'Limited Batch'

const CATEGORY_TRUST_BADGES: Record<string, readonly [string, string]> = {
  'handmade-healthy-bites': ['No Added Sugar', 'Small Batch Crafted'],
  'customised-handmade': ['Made to Order', 'Small Batch Crafted'],
  'kashmir-delights': ['Valley Heritage', 'Traditional Recipes'],
  spices: ['Pampore Origin', 'Lab Tested'],
  kehwa: ['Traditional Blend', 'Valley Inspired'],
  honey: ['Single Origin', 'Unprocessed'],
  shilajit: ['Third-Party Tested', 'Premium Resin'],
  'farm-fresh-dry-fruits-nuts': ['Farm Direct', 'Premium Grade'],
  seeds: ['Clean Label', 'Daily Wellness'],
}

const DEFAULT_TRUST_BADGES = ['Valley Sourced', 'Freshly Packed'] as const

const CATEGORY_LABELS = PRODUCT_CATEGORIES.reduce<Record<string, string>>(
  (acc, category) => {
    acc[category.id] = category.name
    return acc
  },
  {},
)

export function getCategoryTrustBadges(category?: string): readonly [string, string] {
  if (!category) return DEFAULT_TRUST_BADGES
  return CATEGORY_TRUST_BADGES[category] ?? DEFAULT_TRUST_BADGES
}

export function getCategoryLabel(category?: string) {
  if (!category) return undefined
  return CATEGORY_LABELS[category] ?? category.replace(/-/g, ' ')
}

type RatingLike = { rating: number }

export function getProductRatingSummary(ratings?: RatingLike[]) {
  if (!ratings?.length) return null

  const total = ratings.reduce((sum, entry) => sum + entry.rating, 0)
  const average = total / ratings.length

  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
  }
}

export function getProductSocialProof(product: {
  featured?: boolean
  ratings?: RatingLike[]
}): SocialProofLabel | null {
  if (product.featured) return 'Best Seller'

  const summary = getProductRatingSummary(product.ratings)
  if (summary && summary.count >= 3 && summary.average >= 4.5) {
    return 'Top Rated'
  }

  return null
}

export function getProductConversionLabels(product: {
  comparePrice?: number
  price: number
  variants?: { comparePrice?: number; price: number }[]
  createdAt?: string | Date
  quantity?: number
  inStock?: boolean
}): ConversionLabel[] {
  const labels: ConversionLabel[] = []

  const primaryVariant = product.variants?.[0]
  const displayPrice = primaryVariant?.price ?? product.price
  const displayComparePrice =
    primaryVariant?.comparePrice ?? product.comparePrice

  if (
    typeof displayComparePrice === 'number' &&
    displayComparePrice > displayPrice
  ) {
    // Savings shown in price row — no extra urgency label
  }

  if (product.createdAt) {
    const created = new Date(product.createdAt)
    const daysSinceCreated =
      (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated >= 0 && daysSinceCreated <= 30) {
      labels.push('New Arrival')
    }
  }

  if (
    product.inStock !== false &&
    typeof product.quantity === 'number' &&
    product.quantity > 0 &&
    product.quantity <= 15
  ) {
    labels.push('Limited Batch')
  }

  return labels
}

export function formatProductSavings(
  price: number,
  comparePrice?: number,
): { savings: number; percent: number } | null {
  if (typeof comparePrice !== 'number' || comparePrice <= price) return null
  const savings = comparePrice - price
  const percent = Math.round((savings / comparePrice) * 100)
  return { savings, percent }
}

export function getStarString(average: number) {
  const rounded = Math.min(5, Math.max(0, Math.round(average)))
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`
}
