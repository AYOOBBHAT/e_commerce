'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export default function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const slideWidth = container.offsetWidth
    if (slideWidth === 0) return
    const index = Math.round(container.scrollLeft / slideWidth)
    setSelectedImageIndex(Math.min(index, images.length - 1))
  }, [images.length])

  if (images.length === 0) {
    return null
  }

  const mainImage = images[selectedImageIndex] || images[0]

  return (
    <div className="space-y-4">
      {/* Mobile swipe gallery */}
      <div className="lg:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${productName} image gallery`}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-[#FAF7F2]"
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
                quality={90}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((_, index) => (
              <span
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  selectedImageIndex === index
                    ? 'w-5 bg-[#B87333]'
                    : 'w-1.5 bg-stone-300',
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop gallery */}
      <div className="hidden lg:block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#FAF7F2]">
          <Image
            src={mainImage}
            alt={`${productName} - Image ${selectedImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="55vw"
            priority
            quality={90}
          />
        </div>

        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-lg border-2 transition-all',
                  selectedImageIndex === index
                    ? 'border-[#B87333] ring-2 ring-[#B87333] ring-offset-2'
                    : 'border-stone-200 hover:border-stone-400',
                )}
              >
                <Image
                  src={image}
                  alt={`${productName} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="10vw"
                  loading="lazy"
                  quality={75}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
