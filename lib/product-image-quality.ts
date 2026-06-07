export type ProductImageStatus =
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'featured_ready'

export type ProductImageScores = {
  lighting: number
  composition: number
  colorGrading: number
  brandFit: number
}

export type ProductImageMeta = {
  url: string
  status: ProductImageStatus
  scores?: ProductImageScores
  consistencyScore?: number
  validationErrors: string[]
  validationWarnings: string[]
  width?: number
  height?: number
  analyzedAt?: string
}

export const ALLOWED_PRODUCT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedProductImageMimeType =
  (typeof ALLOWED_PRODUCT_IMAGE_MIME_TYPES)[number]

export function isAllowedMimeType(
  type: string,
): type is AllowedProductImageMimeType {
  return ALLOWED_PRODUCT_IMAGE_MIME_TYPES.some((allowed) => allowed === type)
}

export const IMAGE_QUALITY_RULES = {
  targetAspectRatio: 4 / 5,
  aspectToleranceStrict: 0.04,
  aspectToleranceLoose: 0.1,
  minShortEdge: 1600,
  warnShortEdge: 1800,
  maxFileSizeBytes: 10 * 1024 * 1024,
  minFileSizeBytes: 80 * 1024,
  minBlurVariance: 120,
  whitePixelThreshold: 235,
  whiteBorderRatioReject: 0.82,
  allowedMimeTypes: ALLOWED_PRODUCT_IMAGE_MIME_TYPES,
  featuredMinConsistencyScore: 7.5,
  featuredReadyMinScore: 8.5,
} as const

export const IMAGE_STATUS_LABELS: Record<ProductImageStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs Review',
  approved: 'Approved',
  featured_ready: 'Featured Ready',
}

export function averageScores(scores: ProductImageScores): number {
  return (
    (scores.lighting +
      scores.composition +
      scores.colorGrading +
      scores.brandFit) /
    4
  )
}

export function deriveAutoStatus(input: {
  errors: string[]
  warnings: string[]
  scores: ProductImageScores
  aspectRatio: number
}): ProductImageStatus {
  if (input.errors.length > 0) return 'draft'

  const consistency = averageScores(input.scores)
  const aspectDelta = Math.abs(
    input.aspectRatio - IMAGE_QUALITY_RULES.targetAspectRatio,
  )

  if (
    consistency >= IMAGE_QUALITY_RULES.featuredReadyMinScore &&
    aspectDelta <= IMAGE_QUALITY_RULES.aspectToleranceStrict &&
    input.warnings.length === 0
  ) {
    return 'featured_ready'
  }

  if (consistency >= 6.5 && input.warnings.length <= 2) {
    return 'approved'
  }

  return 'needs_review'
}

export function canUseAsFeaturedMainImage(meta?: ProductImageMeta): boolean {
  if (!meta) return false
  if (meta.validationErrors.length > 0) return false
  if (meta.status !== 'approved' && meta.status !== 'featured_ready') return false
  if (
    typeof meta.consistencyScore === 'number' &&
    meta.consistencyScore < IMAGE_QUALITY_RULES.featuredMinConsistencyScore
  ) {
    return false
  }
  return true
}

export function syncImageMetaWithUrls(
  urls: string[],
  existing: ProductImageMeta[],
): ProductImageMeta[] {
  return urls.map((url) => {
    const found = existing.find((entry) => entry.url === url)
    if (found) return found
    return {
      url,
      status: 'needs_review',
      validationErrors: [],
      validationWarnings: ['Legacy image — not analyzed with Zescoh quality system'],
    }
  })
}

export function validateFeaturedProduct(input: {
  featured: boolean
  images: string[]
  imageMeta?: ProductImageMeta[]
}): string | null {
  if (!input.featured || input.images.length === 0) return null

  const mainUrl = input.images[0]
  const mainMeta = input.imageMeta?.find((entry) => entry.url === mainUrl)

  if (!canUseAsFeaturedMainImage(mainMeta)) {
    return 'Featured products require a main image with Approved or Featured Ready status and a consistency score of at least 7.5.'
  }

  return null
}
