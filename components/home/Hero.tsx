'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757784053/file_00000000ca44622fae0e8728733e376e_gflfzi.png',
    mobileImage: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757784053/file_00000000ca44622fae0e8728733e376e_gflfzi.png',
    title: 'Spring Collection 2025',
    subtitle: 'Discover fresh styles for the new season',
    cta: 'Shop Now',
    url: '/category/clothing',
    position: 'right',
    theme: 'light',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757778399/Screenshot_20250913_183609_Adobe_Acrobat_dl32g3.jpg',
    mobileImage: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757778399/Screenshot_20250913_183609_Adobe_Acrobat_dl32g3.jpg',
    title: 'Tech Innovations',
    subtitle: 'Latest gadgets that make life easier',
    cta: 'Explore',
    url: '/category/electronics',
    position: 'left',
    theme: 'dark',
  },
  {
    id: 3,
    image: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757779671/file_000000004cbc61fb85a27a99641c5f0a_ezwev8.png',
    mobileImage: 'https://res.cloudinary.com/dfocwbzzo/image/upload/v1757779671/file_000000004cbc61fb85a27a99641c5f0a_ezwev8.png',
    title: 'Home Essentials',
    subtitle: 'Transform your space with our collection',
    cta: 'Discover',
    url: '/category/home',
    position: 'center',
    theme: 'light',
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // const goToSlide = (index: number) => {
  //   if (isAnimating) return;
  //   setIsAnimating(true);
  //   setCurrent(index);
    
  //   // Reset animation state after animation completes
  //   setTimeout(() => {
  //     setIsAnimating(false);
  //   }, 700); // Slightly longer than the animation duration
  // };
  const goToSlide = useCallback((index: number) => {
  if (isAnimating) return;
  setIsAnimating(true);
  setCurrent(index);
  setTimeout(() => {
    setIsAnimating(false);
  }, 700);
}, [isAnimating]);
  
  const goToNext = useCallback(() => {
    goToSlide((current + 1) % slides.length);
  }, [current, goToSlide]);
  
  const goToPrev = () => {
    goToSlide((current - 1 + slides.length) % slides.length);
  };
  
  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [current, goToNext]);
  
  const slide = slides[current];
  const textColorClass = slide.theme === 'dark' ? 'text-white' : 'text-gray-900';
  const buttonVariant = slide.theme === 'dark' ? 'outline' : 'default';
  
  // Position classes
  let positionClass = 'items-center justify-center text-center';
  if (slide.position === 'left') {
    positionClass = 'items-center justify-start text-left md:pl-16';
  } else if (slide.position === 'right') {
    positionClass = 'items-center justify-end text-right md:pr-16';
  }
  
  return (
    <div className="relative h-[60vh] sm:h-[70vh] lg:h-[80vh] min-h-[400px] sm:min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Desktop Image */}
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority
            className="object-cover sm:object-contain hidden sm:block"
            sizes="100vw"
          />
          
          {/* Mobile Image */}
          <Image
            src={s.mobileImage}
            alt={s.title}
            fill
            priority
            className="object-cover sm:hidden"
            sizes="100vw"
          />
          
          {/* Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:bg-black/20"></div>
          
          {/* Content */}
          <div className={`container mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center sm:${positionClass}`}>
            <div className="max-w-2xl lg:max-w-3xl">
              <h1 
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 transition-transform duration-500 leading-tight ${textColorClass}`}
                style={{
                  transform: index === current ? 'translateY(0)' : 'translateY(20px)',
                  opacity: index === current ? 1 : 0,
                  transitionDelay: '200ms',
                }}
              >
                {s.title}
              </h1>
              <p 
                className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 transition-transform duration-500 leading-relaxed ${
                  s.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}
                style={{
                  transform: index === current ? 'translateY(0)' : 'translateY(20px)',
                  opacity: index === current ? 1 : 0,
                  transitionDelay: '300ms',
                }}
              >
                {s.subtitle}
              </p>
              <Link 
                href={s.url}
                style={{
                  opacity: index === current ? 1 : 0,
                  transitionDelay: '400ms',
                  transition: 'opacity 500ms ease',
                }}
              >
                <Button 
                  size="lg"
                  variant={buttonVariant}
                  className={`h-12 px-8 text-base sm:text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${buttonVariant === 'outline' ? 'border-2 border-white text-white hover:bg-white hover:text-black backdrop-blur-sm' : 'shadow-lg'}`}
                >
                  {s.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
        onClick={goToPrev}
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
        onClick={goToNext}
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      
      {/* Slide indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === current ? 'w-6 sm:w-8 bg-primary' : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}