'use client'

import ProductCard, { type ProductCardProduct } from '@/components/product/ProductCard'

interface ProductCollectionCardProps {
  product: ProductCardProduct
  priority?: boolean
}

/** @deprecated Prefer ProductCard directly — kept for existing imports */
export function ProductCollectionCard({
  product,
  priority,
}: ProductCollectionCardProps) {
  return <ProductCard product={product} priority={priority} />
}
