import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductGrid from '@/components/product/ProductGrid'
import { type ProductCardProduct } from '@/components/product/ProductCard'

interface FeaturedProductsProps {
  products: ProductCardProduct[]
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products?.length) {
    return null
  }

  return (
    <section
      className="border-t border-stone-200/80 bg-white py-10 sm:py-14 lg:py-16"
      aria-labelledby="featured-products-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
              Best Sellers
            </p>
            <h2
              id="featured-products-heading"
              className="mt-1.5 text-xl font-bold text-stone-900 sm:text-2xl"
            >
              Featured Products
            </h2>
          </div>

          <Link
            href="/products/featured"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#B87333] hover:text-stone-900"
          >
            View All
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <ProductGrid products={products} priorityCount={2} ariaLabel="Featured products" />
      </div>
    </section>
  )
}
