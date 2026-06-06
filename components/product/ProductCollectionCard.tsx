'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/CartProvider';

type ProductLike = {
  id?: string;
  _id?: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  unitLabel?: string;
  variants?: {
    label: string;
    price: number;
    comparePrice?: number;
    inStock?: boolean;
  }[];
  image: string;
  inStock: boolean;
  category?: string;
  featured?: boolean;
};

interface ProductCollectionCardProps {
  product: ProductLike;
}

export function ProductCollectionCard({ product }: ProductCollectionCardProps) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const primaryVariant = product.variants?.[0];
  const variantAvailable = primaryVariant ? primaryVariant.inStock !== false : true;
  const displayPrice = primaryVariant?.price ?? product.price;
  const displayComparePrice =
    primaryVariant?.comparePrice ?? (product.comparePrice ?? undefined);
  const displayUnitLabel = primaryVariant?.label || product.unitLabel;

  const hasDiscount =
    typeof displayComparePrice === 'number' && displayComparePrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayComparePrice! - displayPrice) / displayComparePrice!) * 100)
    : null;
  const savings = hasDiscount ? displayComparePrice! - displayPrice : null;

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!product.inStock || !variantAvailable || adding) return;

    setAdding(true);
    addToCart({
      id:
        (product.id || product._id || '') +
        (primaryVariant?.label ? `-${primaryVariant.label}` : ''),
      name: product.name,
      price: displayPrice,
      image: product.image || '/fallback.png',
      quantity: 1,
      unitLabel: displayUnitLabel,
      variantLabel: primaryVariant?.label,
    });

    setTimeout(() => setAdding(false), 1200);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl sm:rounded-2xl"
    >
      <div className="flex h-full flex-col rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-white">
          <Image
            src={product.image || '/fallback.png'}
            alt={product.name}
            fill
            className="object-contain p-3 sm:p-4 md:p-5 transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 60vw, (max-width: 768px) 45vw, (max-width: 1200px) 30vw, 25vw"
            loading="lazy"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          {discountPercent && (
            <Badge className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full bg-rose-600 text-white shadow-sm text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1">
              -{discountPercent}% OFF
            </Badge>
          )}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="secondary" className="bg-white/90 text-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
                Out of stock
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 sm:p-4 space-y-2 sm:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {product.featured && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium uppercase tracking-wide text-emerald-600">
                Best Seller
              </span>
            )}
            {product.category && (
              <span className="rounded-full border border-slate-200 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs text-slate-500 normal-case">
                {product.category}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600">
                ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-slate-400 line-through">
                  ₹{displayComparePrice!.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
            {savings && (
              <p className="text-[10px] sm:text-xs font-medium text-emerald-600">
                Save ₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 0 })} ({discountPercent}% OFF)
              </p>
            )}
            {displayUnitLabel && (
              <p className="text-[10px] sm:text-xs text-slate-500">Pack size: {displayUnitLabel}</p>
            )}
            {product.variants?.length ? (
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                {product.variants.length} pack option{product.variants.length > 1 ? 's' : ''}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="rounded-full bg-amber-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs text-amber-700 font-medium">
                {product.inStock && variantAvailable ? 'In stock' : 'Limited'}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500">MRP (Incl. of all taxes)</span>
            </div>

            <Button
              type="button"
              className="h-9 sm:h-10 md:h-11 rounded-full bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-emerald-200 hover:bg-emerald-500 disabled:opacity-60"
              onClick={handleAddToCart}
              disabled={!product.inStock || !variantAvailable || adding}
            >
              {product.inStock && variantAvailable ? (adding ? 'Adding...' : 'Add to Cart') : 'Notify Me'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

