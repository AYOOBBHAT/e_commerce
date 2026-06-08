import ProductCard, { type ProductCardProduct } from './ProductCard'
import { cn } from '@/lib/utils'

/** Standard product listing grid — 2-col mobile, up to 4-col desktop */
export const PLP_GRID_CLASS =
  'grid list-none grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4'

interface ProductGridProps {
  products: ProductCardProduct[]
  priorityCount?: number
  ariaLabel?: string
  className?: string
}

export default function ProductGrid({
  products,
  priorityCount = 4,
  ariaLabel = 'Products',
  className,
}: ProductGridProps) {
  return (
    <ul className={cn(PLP_GRID_CLASS, className)} aria-label={ariaLabel}>
      {products.map((product, index) => (
        <li
          key={product._id || product.id || product.slug}
          className="min-w-0"
        >
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  )
}
