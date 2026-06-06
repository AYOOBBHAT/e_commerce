"use client";

import { useState } from 'react';
import Image from 'next/image';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const mainImage = images[selectedImageIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] w-full lg:h-[520px] bg-white rounded-2xl border overflow-hidden">
        <Image
          src={mainImage}
          alt={`${productName} - Image ${selectedImageIndex + 1}`}
          fill
          className="object-contain p-6"
          sizes="(max-width: 768px) 100vw, 66vw"
          priority
          quality={90}
        />
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                selectedImageIndex === index
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
                sizes="(max-width: 640px) 25vw, 20vw"
                loading="lazy"
                quality={75}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

