'use client'

import { useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import {
  formatProductSavings,
  getCategoryTrustBadges,
  getProductConversionLabels,
  getProductRatingSummary,
  getProductSocialProof,
  getStarString,
} from '@/lib/product-display'
import { PDP_TRUST_STRIP } from '@/lib/trust-content'
import { createCartItem } from '@/lib/cart/identity'
import { PRODUCT_FALLBACK_IMAGE } from '@/lib/constants'
import { cn } from '@/lib/utils'

type Variant = {
  label: string
  price: number
  comparePrice?: number
  inStock?: boolean
}

export interface ProductBuyBoxProduct {
  _id: string
  name: string
  description: string
  images?: string[]
  price: number
  comparePrice?: number
  unitLabel?: string
  variants?: Variant[]
  inStock: boolean
  category?: string
  featured?: boolean
  ratings?: Array<{ rating: number; review?: string }>
  createdAt?: string | Date
  quantity?: number
}

interface ProductBuyBoxProps {
  product: ProductBuyBoxProduct
}

export default function ProductBuyBox({ product }: ProductBuyBoxProps) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [selectedVariantLabel, setSelectedVariantLabel] = useState(
    product.variants?.[0]?.label || '',
  )

  const activeVariant = useMemo(() => {
    if (!product.variants?.length) return null
    return (
      product.variants.find((variant) => variant.label === selectedVariantLabel) ??
      null
    )
  }, [product.variants, selectedVariantLabel])

  const price = activeVariant?.price ?? product.price
  const comparePrice = activeVariant?.comparePrice ?? product.comparePrice
  const unitLabel = activeVariant?.label ?? product.unitLabel
  const isVariantInStock =
    activeVariant?.inStock ?? (product.variants?.length ? true : product.inStock)
  const isAvailable = product.inStock && isVariantInStock

  const trustBadges = getCategoryTrustBadges(product.category)
  const primaryTrustBadge = trustBadges[0]
  const ratingSummary = getProductRatingSummary(product.ratings)
  const socialProof = getProductSocialProof(product)
  const conversionLabels = getProductConversionLabels({
    ...product,
    price,
    comparePrice,
  })
  const savingsMeta = formatProductSavings(price, comparePrice)

  const buildCartItem = () =>
    createCartItem({
      productId: product._id,
      name: product.name,
      price,
      quantity,
      image: product.images?.[0] || PRODUCT_FALLBACK_IMAGE,
      unitLabel,
      variantLabel: activeVariant?.label,
      variants: product.variants,
    })

  const handleAddToCart = () => {
    if (!isAvailable || adding) return
    setAdding(true)
    addToCart(buildCartItem())
    setQuantity(1)
    setTimeout(() => setAdding(false), 1200)
  }

  const handleBuyNow = () => {
    if (!isAvailable) return
    flushSync(() => {
      addToCart(buildCartItem())
    })
    router.push('/checkout')
  }

  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : prev))
  const increaseQuantity = () =>
    setQuantity((prev) => (prev < 10 ? prev + 1 : prev))

  return (
    <>
      <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        {(socialProof || conversionLabels.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {socialProof && (
              <span className="rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-900">
                {socialProof}
              </span>
            )}
            {conversionLabels.map((label) => (
              <span
                key={label}
                className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-700"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {ratingSummary && (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-stone-600">
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
        )}

        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B87333]">
            {primaryTrustBadge}
          </span>
          <h1 className="text-2xl font-semibold leading-tight text-stone-900 sm:text-3xl">
            {product.name}
          </h1>
          <p className="text-sm text-stone-500">Freshly crafted in Kashmir</p>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900 sm:text-4xl">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {savingsMeta && (
              <span className="text-base text-stone-400 line-through">
                ₹{comparePrice!.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {savingsMeta && (
            <p className="text-sm font-medium text-[#4A6741]">
              Save ₹{savingsMeta.savings.toLocaleString('en-IN')} (
              {savingsMeta.percent}% off)
            </p>
          )}
          {unitLabel && (
            <p className="text-sm text-stone-500">{unitLabel}</p>
          )}
        </div>

        <p
          className={cn(
            'text-sm font-medium',
            isAvailable ? 'text-[#4A6741]' : 'text-stone-500',
          )}
        >
          {isAvailable ? '● In stock · Ships pan-India' : 'Out of stock'}
        </p>

        {product.variants?.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Select pack size</p>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {product.variants.map((variant) => {
                const selected = variant.label === selectedVariantLabel
                const variantOut = variant.inStock === false
                return (
                  <button
                    key={variant.label}
                    type="button"
                    disabled={variantOut}
                    onClick={() => setSelectedVariantLabel(variant.label)}
                    className={cn(
                      'shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
                      selected
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400',
                      variantOut && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    {variant.label}
                    {variantOut ? ' · Sold out' : ''}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">Quantity</p>
          <div className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1.5">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-[#FAF7F2] disabled:opacity-40"
              onClick={decreaseQuantity}
              disabled={quantity === 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-12 text-center text-lg font-semibold text-stone-900">
              {quantity}
            </span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-[#FAF7F2]"
              onClick={increaseQuantity}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable || adding}
            className={cn(
              'h-12 w-full rounded-full text-base font-semibold',
              'bg-stone-900 text-white hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
            )}
          >
            {!isAvailable
              ? 'Out of Stock'
              : adding
                ? 'Adding...'
                : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!isAvailable}
            className={cn(
              'h-12 w-full rounded-full border border-stone-900 text-base font-semibold text-stone-900',
              'hover:bg-stone-50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B87333] focus-visible:ring-offset-2',
            )}
          >
            Buy Now
          </button>
        </div>

        <ul
          className="flex flex-wrap gap-x-3 gap-y-2 border-t border-stone-100 pt-4"
          aria-label="Product trust guarantees"
        >
          {PDP_TRUST_STRIP.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-[#B87333]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        {product.description && (
          <p className="border-t border-stone-100 pt-4 text-sm leading-relaxed text-stone-600 whitespace-pre-line">
            {product.description}
          </p>
        )}
      </div>

      {/* Sticky mobile Add to Cart bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-sm lg:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900">
              ₹{price.toLocaleString('en-IN')}
            </p>
            {unitLabel && (
              <p className="truncate text-[11px] text-stone-500">{unitLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable || adding}
            className={cn(
              'h-11 shrink-0 rounded-full px-6 text-sm font-semibold',
              'bg-stone-900 text-white hover:bg-stone-800',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {!isAvailable
              ? 'Out of Stock'
              : adding
                ? 'Adding...'
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    </>
  )
}
