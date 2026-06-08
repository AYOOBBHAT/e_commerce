import { CATEGORY_IMAGE_RULES } from '@/lib/category-image-quality'

export default function CategoryImageGuidelines() {
  return (
    <div className="rounded-xl border border-stone-200 bg-[#FAF7F2] p-4 text-sm text-stone-600">
      <p className="font-medium text-stone-900">Image guidelines</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs sm:text-sm">
        <li>
          Minimum {CATEGORY_IMAGE_RULES.minWidth}×{CATEGORY_IMAGE_RULES.minHeight}px
          (4:5 portrait)
        </li>
        <li>JPG, PNG, or WEBP — max 10MB</li>
        <li>Warm editorial photography on cream/neutral backgrounds</li>
        <li>Uploaded directly to Cloudinary under /categories</li>
      </ul>
    </div>
  )
}
