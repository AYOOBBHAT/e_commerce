import {
  ACCEPTED_IMAGE_FORMATS_LABEL,
  getMaxFileSizeLabel,
  PRODUCT_IMAGE_REQUIREMENTS,
} from '@/lib/product-image-preview-validation'

export default function ProductImageRequirementsCard() {
  return (
    <div className="rounded-md border border-stone-200 bg-white p-3">
      <p className="text-xs font-semibold text-stone-900">Image requirements</p>
      <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-stone-500">Required aspect ratio</dt>
          <dd className="font-medium text-stone-800">
            {PRODUCT_IMAGE_REQUIREMENTS.aspectRatioLabel}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-stone-500">Recommended resolution</dt>
          <dd className="font-medium text-stone-800">
            {PRODUCT_IMAGE_REQUIREMENTS.recommendedWidth}×
            {PRODUCT_IMAGE_REQUIREMENTS.recommendedHeight}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-stone-500">Minimum resolution</dt>
          <dd className="font-medium text-stone-800">
            {PRODUCT_IMAGE_REQUIREMENTS.minWidth}×
            {PRODUCT_IMAGE_REQUIREMENTS.minHeight}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-stone-500">Accepted formats</dt>
          <dd className="font-medium text-stone-800">
            {ACCEPTED_IMAGE_FORMATS_LABEL}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:col-span-2 sm:block">
          <dt className="text-stone-500">Maximum file size</dt>
          <dd className="font-medium text-stone-800">{getMaxFileSizeLabel()}</dd>
        </div>
      </dl>
    </div>
  )
}
