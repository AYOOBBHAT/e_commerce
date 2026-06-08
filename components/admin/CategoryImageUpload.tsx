'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import CategoryImageGuidelines from '@/components/admin/CategoryImageGuidelines'
import {
  validateCategoryImageFile,
  type CategoryImageAsset,
} from '@/lib/category-image-quality'

const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ecommerce_preset'
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''

type CategoryImageUploadProps = {
  image: string
  imagePublicId?: string
  imageAlt: string
  onImageChange: (asset: CategoryImageAsset | null) => void
}

export default function CategoryImageUpload({
  image,
  imagePublicId,
  imageAlt,
  onImageChange,
}: CategoryImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setWarnings([])

    try {
      const validation = await validateCategoryImageFile(file)
      if (!validation.passed) {
        setError(validation.errors.join(' '))
        return
      }
      if (validation.warnings.length) {
        setWarnings(validation.warnings)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'categories')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      )
      const data = await res.json()

      if (!data.secure_url || !data.public_id) {
        throw new Error('Upload failed')
      }

      onImageChange({
        url: data.secure_url as string,
        publicId: data.public_id as string,
      })
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Image upload failed. Check Cloudinary settings and try again.',
      )
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <Label>Category image</Label>
      <CategoryImageGuidelines />

      {image ? (
        <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl bg-[#FAF7F2] ring-1 ring-stone-200/80">
          <Image
            src={image}
            alt={imageAlt || 'Category preview'}
            fill
            className="object-cover"
            sizes="320px"
            unoptimized={!image.includes('cloudinary.com')}
          />
        </div>
      ) : (
        <div className="flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
          No image uploaded
        </div>
      )}

      {imagePublicId ? (
        <p className="font-mono text-[10px] text-stone-400">
          Cloudinary: {imagePublicId}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={uploading} asChild>
          <label className="cursor-pointer">
            {uploading ? 'Uploading…' : image ? 'Replace image' : 'Upload image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </Button>
        {image ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setWarnings([])
              setError(null)
              onImageChange(null)
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {warnings.length ? (
        <p className="text-sm text-amber-700">{warnings.join(' ')}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
