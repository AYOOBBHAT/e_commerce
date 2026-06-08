import { v2 as cloudinary } from 'cloudinary'

function configureCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return false
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return true
}

/** Extract public_id from a Cloudinary delivery URL */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null

  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return null

  let path = url.slice(uploadIndex + '/upload/'.length)
  path = path.split('?')[0]

  if (path.startsWith('v') && /^v\d+\//.test(path)) {
    path = path.replace(/^v\d+\//, '')
  }

  const lastDot = path.lastIndexOf('.')
  if (lastDot > path.lastIndexOf('/')) {
    path = path.slice(0, lastDot)
  }

  return path || null
}

export async function deleteCloudinaryAsset(
  publicId: string,
): Promise<{ deleted: boolean; skipped?: boolean; reason?: string }> {
  if (!publicId?.trim()) {
    return { deleted: false, skipped: true, reason: 'empty_public_id' }
  }

  if (!configureCloudinary()) {
    console.warn(
      '[cloudinary] Missing CLOUDINARY_API_KEY/SECRET — skipping delete for',
      publicId,
    )
    return { deleted: false, skipped: true, reason: 'missing_credentials' }
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    })
    return { deleted: result.result === 'ok' }
  } catch (error) {
    console.error('[cloudinary] Failed to delete asset:', publicId, error)
    return { deleted: false, reason: 'destroy_failed' }
  }
}

export async function deleteCloudinaryAssetByUrl(
  url: string,
): Promise<{ deleted: boolean; skipped?: boolean; reason?: string }> {
  const publicId = extractCloudinaryPublicId(url)
  if (!publicId) {
    return { deleted: false, skipped: true, reason: 'not_cloudinary_url' }
  }
  return deleteCloudinaryAsset(publicId)
}
