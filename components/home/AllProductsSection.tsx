import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard, { type ProductCardProduct } from '@/components/product/ProductCard'

interface AllProductsSectionProps {
  products: ProductCardProduct[]
}

export default function AllProductsSection({ products }: AllProductsSectionProps) {
  const displayProducts = products.slice(0, 8)

  return (
    <section
      className="border-t border-stone-200/80 bg-white py-10 sm:py-14 lg:py-16"
      aria-labelledby="all-products-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
              Shop Everything
            </p>
            <h2
              id="all-products-heading"
              className="mt-1.5 text-xl font-bold text-stone-900 sm:text-2xl"
            >
              All Products
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#B87333] hover:text-stone-900 sm:self-auto"
          >
            View Store
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {!displayProducts.length ? (
          <p className="py-8 text-center text-sm text-stone-500">No products found.</p>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {displayProducts.map((product, index) => (
              <li key={product._id || product.id || product.slug} className="min-w-0">
                <ProductCard product={product} priority={index < 2} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
