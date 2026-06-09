'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/components/CartProvider'
import { createCartItem } from '@/lib/cart/identity'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/constants'
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

const ctaButtonClass = cn(
  'inline-flex h-9 w-full min-h-[2.25rem] items-center justify-center rounded-full text-xs font-semibold sm:h-10 sm:min-h-[2.5rem] sm:text-sm',
  'bg-stone-900 text-white hover:bg-stone-800',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
)

export default function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState(false)

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1
  const primaryVariant = product.variants?.[0]
  const variantAvailable = primaryVariant ? primaryVariant.inStock !== false : true

  const { displayPrice, displayComparePrice } = useMemo(() => {
    if (hasMultipleVariants && product.variants?.length) {
      const lowestPriceVariant = product.variants.reduce((min, variant) =>
        variant.price < min.price ? variant : min,
      )
      return {
        displayPrice: lowestPriceVariant.price,
        displayComparePrice: lowestPriceVariant.comparePrice ?? product.comparePrice,
      }
    }

    return {
      displayPrice: primaryVariant?.price ?? product.price,
      displayComparePrice: primaryVariant?.comparePrice ?? product.comparePrice ?? undefined,
    }
  }, [hasMultipleVariants, primaryVariant, product])

  const displayUnitLabel = hasMultipleVariants
    ? 'Multiple Options Available'
    : primaryVariant?.label || product.unitLabel

  const trustBadges = getCategoryTrustBadges(product.category)
  const benefitLine = trustBadges[0]
  const socialProof = getProductSocialProof(product)
  const savingsMeta = hasMultipleVariants
    ? null
    : formatProductSavings(displayPrice, displayComparePrice)

  const metadataLine = useMemo(() => {
    const parts: string[] = []
    if (displayUnitLabel) parts.push(displayUnitLabel)
    if (benefitLine) parts.push(benefitLine)
    return parts.length > 0 ? parts.join(' • ') : null
  }, [displayUnitLabel, benefitLine])

  const productHref = `/products/${product.slug}`
  const productImage = product.image?.trim() ? product.image : PRODUCT_FALLBACK_IMAGE

  const isAvailable = hasMultipleVariants
    ? product.inStock &&
      product.variants!.some((variant) => variant.inStock !== false)
    : product.inStock && variantAvailable

  const handleAddToCart = () => {
    if (!isAvailable || adding || hasMultipleVariants) return

    setAdding(true)
    addToCart(
      createCartItem({
        productId: product.id || product._id || '',
        name: product.name,
        price: displayPrice,
        image: productImage,
        quantity: 1,
        unitLabel: primaryVariant?.label || product.unitLabel,
        variantLabel: primaryVariant?.label,
        variants: product.variants,
      }),
    )

    toast.success('Added to cart', {
      description: product.name,
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
            src={productImage}
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

        {!isAvailable && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-950/40">
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-900">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2.5 sm:p-3">
        {socialProof && (
          <span className="text-[9px] font-bold uppercase tracking-wide text-amber-700 sm:text-[10px]">
            {socialProof}
          </span>
        )}

        <h3
          className={cn(
            'line-clamp-2 text-sm font-semibold leading-tight text-stone-900',
            socialProof ? 'mt-0.5' : '',
          )}
        >
          <Link
            href={productHref}
            className="hover:text-[#B87333] focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            {hasMultipleVariants && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                From
              </span>
            )}
            <span className="text-base font-bold text-stone-900 sm:text-lg">
              ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            {savingsMeta && (
              <>
                <span className="text-[11px] text-stone-400 line-through">
                  ₹
                  {displayComparePrice!.toLocaleString('en-IN', {
                    minimumFractionDigits: 0,
                  })}
                </span>
                <span className="text-[10px] font-medium text-[#4A6741] sm:text-[11px]">
                  Save ₹{savingsMeta.savings.toLocaleString('en-IN')}
                </span>
              </>
            )}
          </div>
        </div>

        {metadataLine && (
          <p className="mt-1 line-clamp-1 text-[10px] text-stone-500 sm:text-[11px]">
            {metadataLine}
          </p>
        )}

        <div className="mt-auto pt-2">
          {hasMultipleVariants ? (
            <Link
              href={productHref}
              aria-label={`View options for ${product.name}`}
              className={cn(ctaButtonClass, !isAvailable && 'pointer-events-none opacity-50')}
            >
              {isAvailable ? 'View Options' : 'Out of Stock'}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable || adding}
              aria-label={`Add ${product.name} to cart`}
              className={ctaButtonClass}
            >
              {!isAvailable ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
