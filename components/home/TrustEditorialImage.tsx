'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HandHeart } from 'lucide-react'
import { TRUST_EDITORIAL_IMAGE } from '@/lib/trust-content'

export default function TrustEditorialImage() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-[#FAF7F2]"
        role="img"
        aria-label={TRUST_EDITORIAL_IMAGE.alt}
      >
        <HandHeart className="h-10 w-10 text-[#B87333]/40" aria-hidden />
      </div>
    )
  }

  return (
    <Image
      src={TRUST_EDITORIAL_IMAGE.src}
      alt={TRUST_EDITORIAL_IMAGE.alt}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1023px) 90vw, 40vw"
      quality={85}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  )
}
