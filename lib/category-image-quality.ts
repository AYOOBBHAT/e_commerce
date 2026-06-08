/** Category card / collection image rules (4:5 editorial) */
export const CATEGORY_IMAGE_RULES = {
  minWidth: 1600,
  minHeight: 2000,
  targetAspectRatio: 4 / 5,
  /** Warn outside this tolerance; reject if far wider/taller than 4:5 */
  aspectTolerance: 0.1,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const

export type CategoryImageMimeType =
  (typeof CATEGORY_IMAGE_RULES.allowedMimeTypes)[number]

export function isCategoryImageMimeType(
  type: string,
): type is CategoryImageMimeType {
  return CATEGORY_IMAGE_RULES.allowedMimeTypes.some(
    (allowed) => allowed === type,
  )
}

export type CategoryImageValidation = {
  passed: boolean
  errors: string[]
  warnings: string[]
  width?: number
  height?: number
}

export function validateCategoryImageDimensions(
  width: number,
  height: number,
): CategoryImageValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (width < CATEGORY_IMAGE_RULES.minWidth) {
    errors.push(`Width must be at least ${CATEGORY_IMAGE_RULES.minWidth}px (got ${width}px).`)
  }
  if (height < CATEGORY_IMAGE_RULES.minHeight) {
    errors.push(`Height must be at least ${CATEGORY_IMAGE_RULES.minHeight}px (got ${height}px).`)
  }

  const aspect = width / height
  const target = CATEGORY_IMAGE_RULES.targetAspectRatio
  const aspectDelta = Math.abs(aspect - target) / target

  if (aspectDelta > CATEGORY_IMAGE_RULES.aspectTolerance) {
    errors.push(
      `Use a 4:5 portrait image (recommended ${CATEGORY_IMAGE_RULES.minWidth}×${CATEGORY_IMAGE_RULES.minHeight}px).`,
    )
  } else if (aspectDelta > 0.04) {
    warnings.push('Image is close to 4:5 — a exact 4:5 crop will look best on category cards.')
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    width,
    height,
  }
}

export function validateCategoryImageFileMeta(
  file: File,
): CategoryImageValidation {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isCategoryImageMimeType(file.type)) {
    errors.push('Only JPG, PNG, or WEBP files are allowed.')
  }

  if (file.size > CATEGORY_IMAGE_RULES.maxFileSizeBytes) {
    errors.push('File must be 10MB or smaller.')
  }

  return { passed: errors.length === 0, errors, warnings }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new window.Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read image file'))
    }
    image.src = url
  })
}

/** Client-side validation before Cloudinary upload */
export async function validateCategoryImageFile(
  file: File,
): Promise<CategoryImageValidation> {
  const meta = validateCategoryImageFileMeta(file)
  if (!meta.passed) return meta

  try {
    const image = await loadImageFromFile(file)
    const dimensions = validateCategoryImageDimensions(
      image.naturalWidth,
      image.naturalHeight,
    )
    return {
      passed: dimensions.passed,
      errors: [...meta.errors, ...dimensions.errors],
      warnings: [...meta.warnings, ...dimensions.warnings],
      width: dimensions.width,
      height: dimensions.height,
    }
  } catch {
    return {
      passed: false,
      errors: ['Unable to read image dimensions. Try another file.'],
      warnings: [],
    }
  }
}

export type CategoryImageAsset = {
  url: string
  publicId: string
}
