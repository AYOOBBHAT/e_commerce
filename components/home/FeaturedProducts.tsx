import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import CategoryCarousel, {
  FEATURED_CAROUSEL_ITEM_CLASS,
} from '@/components/home/CategoryCarousel'
import {
  FeaturedProductCard,
  type FeaturedProduct,
} from '@/components/product/FeaturedProductCard'

interface FeaturedProductsProps {
  products: FeaturedProduct[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      className="bg-[#FAF7F2] py-12 sm:py-16 lg:py-20"
      aria-labelledby="featured-products-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
              Best Sellers
            </p>
            <h2
              id="featured-products-heading"
              className="mt-1.5 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl"
            >
              Featured Products
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#B87333] hover:text-stone-900 lg:self-auto"
          >
            View All Products
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="lg:hidden">
          <CategoryCarousel
            itemCount={products.length}
            ariaLabel="Browse featured products"
          >
            {products.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className={FEATURED_CAROUSEL_ITEM_CLASS}
              >
                <FeaturedProductCard
                  product={product}
                  className="touch-pan-y"
                />
              </div>
            ))}
          </CategoryCarousel>
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
          {products.map((product) => (
            <FeaturedProductCard
              key={product._id || product.id || product.slug}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
