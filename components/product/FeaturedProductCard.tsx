'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/CartProvider'
import {
  formatProductSavings,
  getCategoryTrustBadges,
  getProductConversionLabels,
  getProductRatingSummary,
  getProductSocialProof,
  getStarString,
} from '@/lib/product-display'
import { cn } from '@/lib/utils'

export interface FeaturedProduct {
  _id?: string
  id?: string
  slug: string
  name: string
  price: number
  comparePrice?: number
  unitLabel?: string
  variants?: Array<{
    label: string
    price: number
    comparePrice?: number
    inStock?: boolean
  }>
  image: string
  inStock: boolean
  category?: string
  featured?: boolean
  ratings?: Array<{ rating: number; review?: string }>
  createdAt?: string | Date
  quantity?: number
}

interface FeaturedProductCardProps {
  product: FeaturedProduct
  className?: string
}

export function FeaturedProductCard({ product, className }: FeaturedProductCardProps) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)

  const primaryVariant = product.variants?.[0]
  const variantAvailable = primaryVariant ? primaryVariant.inStock !== false : true
  const displayPrice = primaryVariant?.price ?? product.price
  const displayComparePrice =
    primaryVariant?.comparePrice ?? product.comparePrice ?? undefined
  const displayUnitLabel = primaryVariant?.label || product.unitLabel

  const trustBadges = getCategoryTrustBadges(product.category)
  const primaryTrustBadge = trustBadges[0]
  const ratingSummary = getProductRatingSummary(product.ratings)
  const socialProof = getProductSocialProof(product)
  const conversionLabels = getProductConversionLabels(product)
  const savingsMeta = formatProductSavings(displayPrice, displayComparePrice)

  const productHref = `/products/${product.slug}`

  const handleAddToCart = () => {
    if (!product.inStock || !variantAvailable || adding) return

    setAdding(true)
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
    })

    setTimeout(() => setAdding(false), 1200)
  }

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white',
        'shadow-sm shadow-stone-900/[0.06]',
        'motion-safe:transition-shadow motion-safe:hover:shadow-md motion-safe:hover:shadow-stone-900/10',
        className,
      )}
    >
      <div className="group relative aspect-[4/5] overflow-hidden bg-[#FAF7F2]">
        <Link
          href={productHref}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B87333]"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.image || '/fallback.png'}
            alt=""
            fill
            draggable={false}
            className="pointer-events-none object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 82vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
            quality={85}
          />
        </Link>

        {socialProof && (
          <span
            className="pointer-events-none absolute top-2.5 right-2.5 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-stone-900 sm:top-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[10px]"
            aria-hidden
          >
            {socialProof}
          </span>
        )}

        {conversionLabels.length > 0 && (
          <div
            className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col gap-1 sm:top-3 sm:left-3"
            aria-hidden
          >
            {conversionLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-stone-900/10 bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-700 backdrop-blur-sm sm:text-[10px]"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {!product.inStock && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-950/40">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-900">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B87333] sm:text-[11px]">
          {primaryTrustBadge}
        </span>

        <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-stone-900 sm:text-base">
          <Link
            href={productHref}
            className="hover:text-[#B87333] focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        {ratingSummary ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-stone-600">
            <span className="tracking-tight text-amber-600" aria-hidden>
              {getStarString(ratingSummary.average)}
            </span>
            <span className="font-medium text-stone-800">
              {ratingSummary.average.toFixed(1)}
            </span>
            <span className="text-stone-400">
              ({ratingSummary.count}{' '}
              {ratingSummary.count === 1 ? 'review' : 'reviews'})
            </span>
          </p>
        ) : null}

        <div className="mt-2 space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-stone-900 sm:text-xl">
              ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            {savingsMeta && (
              <span className="text-xs text-stone-400 line-through">
                ₹
                {displayComparePrice!.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                })}
              </span>
            )}
          </div>
          {savingsMeta && (
            <p className="text-[11px] font-medium text-[#4A6741] sm:text-xs">
              Save ₹{savingsMeta.savings.toLocaleString('en-IN')} (
              {savingsMeta.percent}% off)
            </p>
          )}
          {displayUnitLabel && (
            <p className="text-[10px] text-stone-500 sm:text-xs">{displayUnitLabel}</p>
          )}
        </div>

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock || !variantAvailable || adding}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              'h-10 w-full rounded-full text-xs font-semibold sm:h-11 sm:text-sm',
              'bg-stone-900 text-white hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
            )}
          >
            {!product.inStock || !variantAvailable
              ? 'Out of Stock'
              : adding
                ? 'Adding...'
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
