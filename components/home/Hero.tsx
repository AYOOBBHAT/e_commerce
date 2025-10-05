'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const slides = [
  {
    id: 1,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950829/2560x1097_saffron_gxtqnn.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950835/1080x1440_saffron_hufr0n.png',
  },
  {
    id: 2,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1759163431/desktop_background_removed_giaaa7.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950883/1080x1440_walnut_kernels_weh9kv.png',
  },
  {
    id: 3,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758951179/chocosms2560x1097_ivkzqc.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950845/1080x1440_handmade_zrombz.png',
  },
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToSlide = useCallback(
    (index: number) => {
      if (isAnimating) return
      setIsAnimating(true)
      setCurrent(index)
      setTimeout(() => setIsAnimating(false), 700)
    },
    [isAnimating]
  )

  const goToNext = useCallback(() => {
    goToSlide((current + 1) % slides.length)
  }, [current, goToSlide])

  const goToPrev = useCallback(() => {
    goToSlide((current - 1 + slides.length) % slides.length)
  }, [current, goToSlide])

  useEffect(() => {
    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [goToNext])

  return (
    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[400px] sm:min-h-[500px] max-h-[800px] overflow-hidden bg-white">
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current
              ? 'opacity-100 z-10 pointer-events-auto'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Responsive Images */}
          <div className="absolute inset-0">
            <picture>
              <source media="(max-width: 640px)" srcSet={s.mobileImage} />
              <Image
                src={s.desktopImage}
                alt="Slide image"
                fill
                priority={index === current}
                className="object-cover"
                sizes="100vw"
              />
            </picture>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
        onClick={goToPrev}
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
        onClick={goToNext}
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      {/* Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === current
                ? 'w-6 sm:w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
