'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/components/CartProvider'
import {
  formatProductSavings,
  getCategoryTrustBadges,
  getProductSocialProof,
} from '@/lib/product-display'
import { cn } from '@/lib/utils'

export interface ProductCardProduct {
  id?: string
  _id?: string
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
}

interface ProductCardProps {
  product: ProductCardProduct
  className?: string
  priority?: boolean
}

export default function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)

  const primaryVariant = product.variants?.[0]
  const variantAvailable = primaryVariant ? primaryVariant.inStock !== false : true
  const displayPrice = primaryVariant?.price ?? product.price
  const displayComparePrice =
    primaryVariant?.comparePrice ?? product.comparePrice ?? undefined
  const displayUnitLabel = primaryVariant?.label || product.unitLabel

  const trustBadges = getCategoryTrustBadges(product.category)
  const benefitLine = trustBadges[0]
  const socialProof = getProductSocialProof(product)
  const savingsMeta = formatProductSavings(displayPrice, displayComparePrice)

  const productHref = `/products/${product.slug}`
  const isAvailable = product.inStock && variantAvailable

  const handleAddToCart = () => {
    if (!isAvailable || adding) return

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
        'shadow-sm shadow-stone-900/[0.05]',
        'motion-safe:transition-shadow motion-safe:hover:shadow-md motion-safe:hover:shadow-stone-900/10',
        className,
      )}
    >
      <div className="group relative aspect-[4/5] shrink-0 overflow-hidden bg-[#FAF7F2]">
        <Link
          href={productHref}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B87333]"
          aria-label={`View ${product.name}`}
        >
          <Image
            src={product.image || '/fallback.png'}
            alt={product.name}
            fill
            priority={priority}
            draggable={false}
            className="pointer-events-none object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 25vw"
            loading={priority ? undefined : 'lazy'}
            quality={85}
          />
        </Link>

        {!product.inStock && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-950/40">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-900">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-3.5">
        {socialProof && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
            {socialProof}
          </span>
        )}

        <h3
          className={cn(
            'line-clamp-2 text-sm font-semibold leading-snug text-stone-900',
            socialProof ? 'mt-1' : '',
          )}
        >
          <Link
            href={productHref}
            className="hover:text-[#B87333] focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 space-y-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-bold text-stone-900 sm:text-lg">
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
            <p className="text-[11px] font-medium text-[#4A6741]">
              Save ₹{savingsMeta.savings.toLocaleString('en-IN')}
            </p>
          )}
          {displayUnitLabel && (
            <p className="text-[10px] text-stone-500 sm:text-xs">{displayUnitLabel}</p>
          )}
        </div>

        <p className="mt-1.5 line-clamp-1 text-xs text-stone-600">{benefitLine}</p>

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable || adding}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              'h-10 w-full rounded-full text-xs font-semibold sm:h-11 sm:text-sm',
              'bg-stone-900 text-white hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
            )}
          >
            {!isAvailable ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  )
}
