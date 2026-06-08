'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ecommerce_preset'
const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ''

type CategoryImageUploadProps = {
  image: string
  imageAlt: string
  onImageChange: (url: string) => void
}

export default function CategoryImageUpload({
  image,
  imageAlt,
  onImageChange,
}: CategoryImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData },
      )
      const data = await res.json()
      if (!data.secure_url) {
        throw new Error('Upload failed')
      }
      onImageChange(data.secure_url)
    } catch {
      setError('Image upload failed. Check Cloudinary settings and try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <Label>Category image</Label>
      {image ? (
        <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl bg-[#FAF7F2]">
          <Image
            src={image}
            alt={imageAlt || 'Category preview'}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/5] w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
          No image uploaded
        </div>
      )}
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
          <Button type="button" variant="ghost" onClick={() => onImageChange('')}>
            Remove
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
