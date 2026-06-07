'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlertCircle, X } from 'lucide-react'
import { analyzeProductImageFile } from '@/lib/analyze-product-image'
import {
  IMAGE_STATUS_LABELS,
  syncImageMetaWithUrls,
  type ProductImageMeta,
  type ProductImageStatus,
} from '@/lib/product-image-quality'
import ProductImageGuidelines from '@/components/admin/ProductImageGuidelines'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ecommerce_preset'
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''

type ProductImageUploadPanelProps = {
  images: string[]
  imageMeta: ProductImageMeta[]
  onChange: (images: string[], imageMeta: ProductImageMeta[]) => void
}

const STATUS_STYLES: Record<ProductImageStatus, string> = {
  draft: 'bg-stone-100 text-stone-700',
  needs_review: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  featured_ready: 'bg-[#B87333]/15 text-[#8B5A2B]',
}

export default function ProductImageUploadPanel({
  images,
  imageMeta,
  onChange,
}: ProductImageUploadPanelProps) {
  const [uploading, setUploading] = useState(false)
  const [rejections, setRejections] = useState<string[]>([])

  const metaByUrl = new Map(imageMeta.map((entry) => [entry.url, entry]))

  const updateAll = (nextImages: string[], nextMeta: ProductImageMeta[]) => {
    onChange(nextImages, syncImageMetaWithUrls(nextImages, nextMeta))
  }

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData },
    )
    const data = await res.json()
    if (!data.secure_url) throw new Error('Cloudinary upload failed')
    return data.secure_url as string
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    setRejections([])
    const nextImages = [...images]
    const nextMeta = [...imageMeta]
    const rejected: string[] = []

    for (const file of Array.from(files)) {
      try {
        const analysis = await analyzeProductImageFile(file)
        if (!analysis.passed) {
          rejected.push(
            `${file.name}: ${analysis.meta.validationErrors.join(' ')}`,
          )
          continue
        }

        const url = await uploadToCloudinary(file)
        nextImages.push(url)
        nextMeta.push({
          url,
          ...analysis.meta,
        })
      } catch (error) {
        rejected.push(
          `${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`,
        )
      }
    }

    updateAll(nextImages, nextMeta)
    setRejections(rejected)
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const url = images[index]
    updateAll(
      images.filter((_, i) => i !== index),
      imageMeta.filter((entry) => entry.url !== url),
    )
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    const nextImages = [...images]
    const [moved] = nextImages.splice(fromIndex, 1)
    nextImages.splice(toIndex, 0, moved)
    updateAll(nextImages, imageMeta)
  }

  const updateStatus = (url: string, status: ProductImageStatus) => {
    const nextMeta = imageMeta.map((entry) =>
      entry.url === url ? { ...entry, status } : entry,
    )
    onChange(images, nextMeta)
  }

  return (
    <div className="space-y-4">
      <ProductImageGuidelines />

      <div>
        <Label htmlFor="product-images">Product Images</Label>
        <p className="mb-2 text-xs text-muted-foreground">
          First image is the homepage hero. Uploads are validated for 4:5 editorial
          quality before Cloudinary upload.
        </p>
        <input
          id="product-images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm"
        />
        {uploading && (
          <p className="mt-1 text-xs text-muted-foreground">
            Analyzing and uploading…
          </p>
        )}
      </div>

      {rejections.length > 0 && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          role="alert"
        >
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            {rejections.length} image{rejections.length > 1 ? 's' : ''} rejected
          </div>
          <ul className="list-disc space-y-1 pl-4">
            {rejections.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          {images.map((url, index) => {
            const meta = metaByUrl.get(url)
            return (
              <div
                key={url}
                className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3 sm:flex-row"
              >
                <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-md bg-[#FAF7F2] sm:w-36">
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-stone-700"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={meta?.status ?? 'needs_review'}
                      onChange={(event) =>
                        updateStatus(
                          url,
                          event.target.value as ProductImageStatus,
                        )
                      }
                      className={cn(
                        'rounded-full border-0 px-2.5 py-1 text-[11px] font-semibold',
                        STATUS_STYLES[meta?.status ?? 'needs_review'],
                      )}
                      aria-label={`Status for image ${index + 1}`}
                    >
                      {Object.entries(IMAGE_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {typeof meta?.consistencyScore === 'number' && (
                      <span className="text-xs text-stone-600">
                        Consistency:{' '}
                        <strong>{meta.consistencyScore.toFixed(1)}/10</strong>
                      </span>
                    )}
                    {meta?.width && meta?.height && (
                      <span className="text-xs text-stone-400">
                        {meta.width}×{meta.height}
                      </span>
                    )}
                  </div>

                  {meta?.scores && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-600 sm:grid-cols-4">
                      <span>Lighting: {meta.scores.lighting}</span>
                      <span>Composition: {meta.scores.composition}</span>
                      <span>Color: {meta.scores.colorGrading}</span>
                      <span>Brand fit: {meta.scores.brandFit}</span>
                    </div>
                  )}

                  {meta?.validationWarnings?.length ? (
                    <ul className="text-[11px] text-amber-800">
                      {meta.validationWarnings.map((warning) => (
                        <li key={warning}>⚠ {warning}</li>
                      ))}
                    </ul>
                  ) : null}

                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, 0)}
                      className="text-xs font-medium text-[#B87333] hover:underline"
                    >
                      Set as main image
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { syncImageMetaWithUrls }
