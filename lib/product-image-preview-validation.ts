import { IMAGE_QUALITY_RULES } from '@/lib/product-image-quality'

export const PRODUCT_IMAGE_REQUIREMENTS = {
  aspectRatioLabel: '4:5',
  targetAspectRatio: 4 / 5,
  recommendedWidth: 2000,
  recommendedHeight: 2500,
  minWidth: 1200,
  minHeight: 1500,
  aspectTolerance: 0.04,
} as const

export type ProductImagePreviewLevel = 'featured_ready' | 'ok' | 'warning'

export type ProductImagePreviewResult = {
  fileName: string
  width: number
  height: number
  aspectRatioLabel: string
  level: ProductImagePreviewLevel
  message: string
}

function loadImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read image dimensions'))
    }
    image.src = url
  })
}

export function formatAspectRatioLabel(width: number, height: number): string {
  const ratio = width / height

  if (Math.abs(ratio - 4 / 5) < PRODUCT_IMAGE_REQUIREMENTS.aspectTolerance) {
    return '4:5'
  }
  if (Math.abs(ratio - 1) < PRODUCT_IMAGE_REQUIREMENTS.aspectTolerance) {
    return '1:1'
  }
  if (Math.abs(ratio - 3 / 4) < PRODUCT_IMAGE_REQUIREMENTS.aspectTolerance) {
    return '3:4'
  }
  if (Math.abs(ratio - 16 / 9) < PRODUCT_IMAGE_REQUIREMENTS.aspectTolerance) {
    return '16:9'
  }

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  const simplifiedW = Math.round(width / divisor)
  const simplifiedH = Math.round(height / divisor)

  if (simplifiedW > 20 || simplifiedH > 20) {
    return `${ratio.toFixed(2)}:1`
  }

  return `${simplifiedW}:${simplifiedH}`
}

export function evaluateProductImagePreview(
  width: number,
  height: number,
): Pick<ProductImagePreviewResult, 'aspectRatioLabel' | 'level' | 'message'> {
  const aspectRatioLabel = formatAspectRatioLabel(width, height)
  const aspectDelta = Math.abs(
    width / height - PRODUCT_IMAGE_REQUIREMENTS.targetAspectRatio,
  )
  const isFourFive = aspectDelta <= PRODUCT_IMAGE_REQUIREMENTS.aspectTolerance
  const meetsRecommended =
    width >= PRODUCT_IMAGE_REQUIREMENTS.recommendedWidth &&
    height >= PRODUCT_IMAGE_REQUIREMENTS.recommendedHeight
  const meetsMinimum =
    width >= PRODUCT_IMAGE_REQUIREMENTS.minWidth &&
    height >= PRODUCT_IMAGE_REQUIREMENTS.minHeight

  if (isFourFive && meetsRecommended) {
    return {
      aspectRatioLabel,
      level: 'featured_ready',
      message: `${aspectRatioLabel} ✓ Featured Ready`,
    }
  }

  if (isFourFive && meetsMinimum) {
    return {
      aspectRatioLabel,
      level: 'ok',
      message: `${aspectRatioLabel} — meets minimum; ${PRODUCT_IMAGE_REQUIREMENTS.recommendedWidth}×${PRODUCT_IMAGE_REQUIREMENTS.recommendedHeight} recommended for homepage grids`,
    }
  }

  if (!isFourFive) {
    return {
      aspectRatioLabel,
      level: 'warning',
      message: `Warning: ${aspectRatioLabel} image detected — target ${PRODUCT_IMAGE_REQUIREMENTS.aspectRatioLabel} for editorial grids`,
    }
  }

  if (!meetsMinimum) {
    return {
      aspectRatioLabel,
      level: 'warning',
      message: `Warning: resolution below ${PRODUCT_IMAGE_REQUIREMENTS.minWidth}×${PRODUCT_IMAGE_REQUIREMENTS.minHeight} minimum`,
    }
  }

  return {
    aspectRatioLabel,
    level: 'ok',
    message: `${aspectRatioLabel} — acceptable for upload`,
  }
}

export async function previewProductImageFile(
  file: File,
): Promise<ProductImagePreviewResult> {
  const { width, height } = await loadImageDimensions(file)
  const evaluation = evaluateProductImagePreview(width, height)

  return {
    fileName: file.name,
    width,
    height,
    ...evaluation,
  }
}

export function formatMaxFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb % 1 === 0 ? `${mb} MB` : `${mb.toFixed(1)} MB`
}

export const ACCEPTED_IMAGE_FORMATS_LABEL = 'JPG, PNG, WEBP'

export function getMaxFileSizeLabel(): string {
  return formatMaxFileSize(IMAGE_QUALITY_RULES.maxFileSizeBytes)
}
