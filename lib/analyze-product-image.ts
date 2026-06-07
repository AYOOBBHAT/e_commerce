import {
  IMAGE_QUALITY_RULES,
  averageScores,
  deriveAutoStatus,
  isAllowedMimeType,
  type ProductImageMeta,
  type ProductImageScores,
} from '@/lib/product-image-quality'

export type ImageAnalysisResult = {
  passed: boolean
  meta: Omit<ProductImageMeta, 'url'>
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

function sampleBorderPixels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const border = Math.max(4, Math.floor(Math.min(width, height) * 0.05))
  let whiteCount = 0
  let transparentCount = 0
  let total = 0

  const inspect = (x: number, y: number) => {
    const data = ctx.getImageData(x, y, 1, 1).data
    total += 1
    if (data[3] < 250) transparentCount += 1
    if (
      data[0] >= IMAGE_QUALITY_RULES.whitePixelThreshold &&
      data[1] >= IMAGE_QUALITY_RULES.whitePixelThreshold &&
      data[2] >= IMAGE_QUALITY_RULES.whitePixelThreshold
    ) {
      whiteCount += 1
    }
  }

  for (let x = 0; x < width; x += 2) {
    for (let y = 0; y < border; y += 2) {
      inspect(x, y)
      inspect(x, height - 1 - y)
    }
  }
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < border; x += 2) {
      inspect(x, y)
      inspect(width - 1 - x, y)
    }
  }

  return {
    whiteRatio: total ? whiteCount / total : 0,
    hasTransparency: total ? transparentCount / total > 0.08 : false,
  }
}

function computeBlurVariance(imageData: ImageData): number {
  const { data, width, height } = imageData
  const gray: number[] = []

  for (let i = 0; i < data.length; i += 4) {
    gray.push(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
  }

  let sum = 0
  let sumSq = 0
  let count = 0

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const laplacian =
        -4 * gray[idx] +
        gray[idx - 1] +
        gray[idx + 1] +
        gray[idx - width] +
        gray[idx + width]
      sum += laplacian
      sumSq += laplacian * laplacian
      count += 1
    }
  }

  if (!count) return 0
  const mean = sum / count
  return sumSq / count - mean * mean
}

function computeScores(input: {
  width: number
  height: number
  imageData: ImageData
  whiteRatio: number
  blurVariance: number
}): ProductImageScores {
  const aspectRatio = input.width / input.height
  const aspectDelta = Math.abs(
    aspectRatio - IMAGE_QUALITY_RULES.targetAspectRatio,
  )

  const composition = Math.max(1, Math.min(10, 10 - aspectDelta * 40))

  const { data } = input.imageData
  let luminanceSum = 0
  let warmSum = 0
  let pixels = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    luminanceSum += r * 0.299 + g * 0.587 + b * 0.114
    warmSum += r - b
    pixels += 1
  }

  const avgLuminance = luminanceSum / pixels
  const lighting =
    avgLuminance >= 70 && avgLuminance <= 210
      ? 9
      : avgLuminance >= 50 && avgLuminance <= 230
        ? 7
        : 4

  const warmth = warmSum / pixels
  const colorGrading =
    warmth > 8 ? 9 : warmth > 0 ? 7.5 : warmth > -10 ? 6 : 4.5

  const shortEdge = Math.min(input.width, input.height)
  const resolutionScore =
    shortEdge >= IMAGE_QUALITY_RULES.warnShortEdge
      ? 10
      : shortEdge >= IMAGE_QUALITY_RULES.minShortEdge
        ? 8
        : 4

  const whitePenalty = input.whiteRatio > 0.65 ? 4 : input.whiteRatio > 0.45 ? 2 : 0
  const blurPenalty =
    input.blurVariance < IMAGE_QUALITY_RULES.minBlurVariance ? 3 : 0

  const brandFit = Math.max(
    1,
    Math.min(
      10,
      (composition + lighting + colorGrading + resolutionScore) / 4 -
        whitePenalty -
        blurPenalty,
    ),
  )

  return {
    lighting: Math.round(lighting * 10) / 10,
    composition: Math.round(composition * 10) / 10,
    colorGrading: Math.round(colorGrading * 10) / 10,
    brandFit: Math.round(brandFit * 10) / 10,
  }
}

export async function analyzeProductImageFile(
  file: File,
): Promise<ImageAnalysisResult> {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isAllowedMimeType(file.type)) {
    errors.push('File must be JPEG, PNG, or WebP.')
  }

  if (file.size > IMAGE_QUALITY_RULES.maxFileSizeBytes) {
    errors.push('File exceeds 10 MB limit.')
  }

  if (file.size < IMAGE_QUALITY_RULES.minFileSizeBytes) {
    errors.push('File is too small — likely low quality or corrupt.')
  }

  const image = await loadImageFromFile(file)
  const width = image.naturalWidth
  const height = image.naturalHeight
  const shortEdge = Math.min(width, height)
  const aspectRatio = width / height

  if (shortEdge < IMAGE_QUALITY_RULES.minShortEdge) {
    errors.push(
      `Resolution too low (${width}×${height}). Minimum short edge is ${IMAGE_QUALITY_RULES.minShortEdge}px.`,
    )
  } else if (shortEdge < IMAGE_QUALITY_RULES.warnShortEdge) {
    warnings.push(
      `Resolution acceptable but below ideal (${width}×${height}). Prefer ${IMAGE_QUALITY_RULES.warnShortEdge}px+ on the short edge.`,
    )
  }

  const aspectDelta = Math.abs(
    aspectRatio - IMAGE_QUALITY_RULES.targetAspectRatio,
  )
  if (aspectDelta > IMAGE_QUALITY_RULES.aspectToleranceLoose) {
    errors.push(
      `Aspect ratio ${width}:${height} is not close to required 4:5 editorial format.`,
    )
  } else if (aspectDelta > IMAGE_QUALITY_RULES.aspectToleranceStrict) {
    warnings.push('Crop is close but not ideal — target exact 4:5 for homepage grids.')
  }

  const canvas = document.createElement('canvas')
  const scale = Math.min(1, 480 / Math.max(width, height))
  canvas.width = Math.floor(width * scale)
  canvas.height = Math.floor(height * scale)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  let whiteRatio = 0
  let hasTransparency = false
  let blurVariance = 0
  let scores: ProductImageScores = {
    lighting: 5,
    composition: 5,
    colorGrading: 5,
    brandFit: 5,
  }

  if (!ctx) {
    errors.push('Browser could not analyze this image.')
  } else {
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const border = sampleBorderPixels(ctx, canvas.width, canvas.height)
    whiteRatio = border.whiteRatio
    hasTransparency = border.hasTransparency

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    blurVariance = computeBlurVariance(imageData)
    scores = computeScores({
      width,
      height,
      imageData,
      whiteRatio,
      blurVariance,
    })

    if (whiteRatio >= IMAGE_QUALITY_RULES.whiteBorderRatioReject) {
      errors.push(
        'White-background packshot detected. Use warm editorial photography on wood, stone, or copper surfaces.',
      )
    } else if (whiteRatio >= 0.6) {
      warnings.push('Image has a lot of white space — may look like a marketplace listing.')
    }

    if (hasTransparency && file.type === 'image/png') {
      errors.push(
        'Transparent PNG cutout detected. Upload lifestyle photography with a natural background.',
      )
    }

    if (blurVariance < IMAGE_QUALITY_RULES.minBlurVariance) {
      errors.push('Image appears blurry or out of focus.')
    }
  }

  const consistencyScore = averageScores(scores)
  const status = deriveAutoStatus({
    errors,
    warnings,
    scores,
    aspectRatio,
  })

  return {
    passed: errors.length === 0,
    meta: {
      status,
      scores,
      consistencyScore: Math.round(consistencyScore * 10) / 10,
      validationErrors: errors,
      validationWarnings: warnings,
      width,
      height,
      analyzedAt: new Date().toISOString(),
    },
  }
}
