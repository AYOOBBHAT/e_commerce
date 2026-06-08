import { deleteCloudinaryAsset, extractCloudinaryPublicId } from '@/lib/cloudinary-admin'

type CategoryImageUpdate = {
  previousPublicId?: string | null
  previousUrl?: string | null
  nextPublicId?: string | null
  nextUrl?: string | null
}

/** Delete replaced Cloudinary asset when the image changes (non-blocking on failure) */
export async function cleanupReplacedCategoryImage({
  previousPublicId,
  previousUrl,
  nextPublicId,
  nextUrl,
}: CategoryImageUpdate) {
  const resolvedPrevious =
    previousPublicId?.trim() ||
    (previousUrl ? extractCloudinaryPublicId(previousUrl) : null)
  const resolvedNext =
    nextPublicId?.trim() || (nextUrl ? extractCloudinaryPublicId(nextUrl) : null)

  if (!resolvedPrevious) return
  if (resolvedPrevious === resolvedNext) return

  await deleteCloudinaryAsset(resolvedPrevious)
}
