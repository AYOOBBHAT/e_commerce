'use client'

import Image from 'next/image'
import { CheckCircle2, XCircle } from 'lucide-react'

const APPROVED_EXAMPLE =
  'https://images.unsplash.com/photo-1589308078051-8d76163d9218?auto=format&fit=crop&w=400&h=500&q=80'
const REJECTED_EXAMPLE =
  'https://images.unsplash.com/photo-1615485290382-44100d406ea8?auto=format&fit=crop&w=400&h=400&q=80'

export default function ProductImageGuidelines() {
  return (
    <div className="rounded-lg border border-stone-200 bg-[#FAF7F2] p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-900">
          Zescoh product photography standards
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-600">
          Featured and homepage images must be 4:5 editorial photography with warm
          lighting, natural textures, and Kashmir-inspired styling. Marketplace
          packshots are rejected automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-emerald-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Approved
          </div>
          <div className="relative mb-2 aspect-[4/5] overflow-hidden rounded-md bg-stone-100">
            <Image
              src={APPROVED_EXAMPLE}
              alt="Approved editorial example — laddus on wooden surface with warm light"
              fill
              className="object-cover"
              sizes="200px"
            />
          </div>
          <ul className="space-y-1 text-[11px] text-stone-600">
            <li>4:5 ratio · 1600px+ short edge</li>
            <li>Wood, copper, stone backgrounds</li>
            <li>Warm side lighting</li>
            <li>Product in context, not floating cutout</li>
          </ul>
        </div>

        <div className="rounded-md border border-red-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-800">
            <XCircle className="h-3.5 w-3.5" aria-hidden />
            Rejected
          </div>
          <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-white border border-stone-100">
            <Image
              src={REJECTED_EXAMPLE}
              alt="Rejected example — isolated product on white background"
              fill
              className="object-contain p-4"
              sizes="200px"
            />
          </div>
          <ul className="space-y-1 text-[11px] text-stone-600">
            <li>White background cutouts</li>
            <li>Transparent PNG packshots</li>
            <li>Blurry or low-resolution files</li>
            <li>Wrong aspect ratio (1:1 catalog squares)</li>
          </ul>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Photography checklist
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-stone-600 sm:grid-cols-2">
          <li>☐ 4:5 crop exported at 2000×2500px</li>
          <li>☐ Single warm light from camera left</li>
          <li>☐ FSSAI label readable in safe zone</li>
          <li>☐ No pure #FFFFFF background</li>
          <li>☐ Props: walnut, copper, linen, stone</li>
          <li>☐ One LUT / color grade across SKUs</li>
        </ul>
      </div>
    </div>
  )
}
