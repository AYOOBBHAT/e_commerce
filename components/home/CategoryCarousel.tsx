'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type CategoryCarouselProps = {
  itemCount: number
  children: React.ReactNode
  ariaLabel?: string
}

/** Card width + gap used for scroll position tracking */
export const CATEGORY_CAROUSEL_CARD_WIDTH_RATIO = 0.76
const CARD_GAP_PX = 12

export default function CategoryCarousel({
  itemCount,
  children,
  ariaLabel = 'Shop by category',
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateActiveIndex = useCallback(() => {
    const container = scrollRef.current
    if (!container || itemCount === 0) return

    const slideWidth = container.offsetWidth * CATEGORY_CAROUSEL_CARD_WIDTH_RATIO
    const index = Math.round(container.scrollLeft / (slideWidth + CARD_GAP_PX))
    setActiveIndex(Math.min(Math.max(index, 0), itemCount - 1))
  }, [itemCount])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    container.addEventListener('scroll', updateActiveIndex, { passive: true })
    return () => container.removeEventListener('scroll', updateActiveIndex)
  }, [updateActiveIndex])

  return (
    <div>
      <div
        ref={scrollRef}
        className={cn(
          'flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1',
          '-mx-4 px-4 touch-pan-x',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        )}
        aria-label={ariaLabel}
      >
        {children}
      </div>

      {itemCount > 1 && (
        <div
          className="mt-4 flex items-center justify-center gap-1.5"
          aria-hidden
        >
          {Array.from({ length: itemCount }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === activeIndex
                  ? 'w-5 bg-[#B87333]'
                  : 'w-1.5 bg-stone-300',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const CATEGORY_CAROUSEL_ITEM_CLASS =
  'w-[76vw] max-w-[320px] shrink-0 snap-start snap-always'
