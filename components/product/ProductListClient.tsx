'use client';

import { useMemo, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import type { ProductCardProduct } from '@/components/product/ProductCard';
import ProductFilters from './ProductFilters';

type Product = ProductCardProduct & { createdAt?: string };

interface ProductListClientProps {
  products: Product[];
}

export default function ProductListClient({ products }: ProductListClientProps) {
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in' | 'out'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');

  const displayedProducts = useMemo(() => {
    const getPrice = (product: Product) =>
      product.variants?.[0]?.price ?? product.price ?? 0;

    let filtered = [...products];
    
    if (availabilityFilter === 'in') {
      filtered = filtered.filter((p) => p.inStock);
    } else if (availabilityFilter === 'out') {
      filtered = filtered.filter((p) => !p.inStock);
    }

    switch (sortOption) {
      case 'priceLow':
        filtered.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case 'priceHigh':
        filtered.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
    }

    return filtered;
  }, [products, availabilityFilter, sortOption]);

  return (
    <>
      <ProductFilters
        availabilityFilter={availabilityFilter}
        sortOption={sortOption}
        onAvailabilityChange={setAvailabilityFilter}
        onSortChange={setSortOption}
        productCount={displayedProducts.length}
      />

      {displayedProducts.length === 0 ? (
        <div className="p-6 text-center">
          No products match the selected filters.
        </div>
      ) : (
        <ProductGrid products={displayedProducts} />
      )}
    </>
  );
}

