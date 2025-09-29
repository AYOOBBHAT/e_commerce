'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Example slides – replace desktopImage/mobileImage with your own
const slides = [
  {
    id: 1,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950829/2560x1097_saffron_gxtqnn.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950835/1080x1440_saffron_hufr0n.png',
    title: 'Spring Collection 2025',
    subtitle: 'Discover fresh styles for the new season',
    cta: 'Shop Now',
    url: '/category/clothing',
    position: 'right',
    theme: 'light',
  },
  {
    id: 2,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950995/mamra_and_walnut_2560x1097_tyovbd.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950883/1080x1440_walnut_kernels_weh9kv.png',
    title: 'Tech Innovations',
    subtitle: 'Latest gadgets that make life easier',
    cta: 'Shop Now',
    url: '/category/electronics',
    position: 'right',
    theme: 'light',
  },
  {
    id: 3,
    desktopImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758951179/chocosms2560x1097_ivkzqc.png',
    mobileImage:
      'https://res.cloudinary.com/dfocwbzzo/image/upload/v1758950845/1080x1440_handmade_zrombz.png',
    title: 'Tech Innovations',
    subtitle: 'Latest gadgets that make life easier',
    cta: 'Shop Now',
    url: '/category/electronics',
    position: 'right',
    theme: 'light',
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

  const slide = slides[current]
  const textColorClass = slide.theme === 'dark' ? 'text-white' : 'text-gray-900'

  let positionClass = 'items-center justify-center text-center'
  if (slide.position === 'left') {
    positionClass = 'items-center justify-start text-left md:pl-16'
  } else if (slide.position === 'right') {
    positionClass = 'items-center justify-end text-right md:pr-16'
  }

  return (
    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[400px] sm:min-h-[500px] max-h-[800px] overflow-hidden bg-white">
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Responsive Images (desktop + mobile) */}
          <picture>
            <source media="(max-width: 640px)" srcSet={s.mobileImage} />
            <Image
              src={s.desktopImage}
              alt={s.title}
              fill
              priority={index === current}
              className="object-cover"
              sizes="100vw"
            />
          </picture>

          {/* Content */}
          <div
            className={`container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col ${positionClass}`}
          >
            <div className="max-w-2xl lg:max-w-3xl">
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight ${textColorClass}`}
              >
                {s.title}
              </h1>
              <p
                className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 leading-relaxed ${
                  s.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                {s.subtitle}
              </p>
              <Link href={s.url}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-black text-white border-2 border-black hover:bg-white hover:text-black"
                >
                  {s.cta}
                </Button>
              </Link>
            </div>
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
                ? 'w-6 sm:w-8 bg-primary'
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
