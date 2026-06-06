'use client';

import { useMemo, useState } from 'react';
import { ProductCollectionCard } from '@/components/product/ProductCollectionCard';
import ProductFilters from './ProductFilters';

interface Product {
  _id?: string;
  id?: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  unitLabel?: string;
  variants?: {
    label: string;
    price: number;
    comparePrice?: number;
    inStock?: boolean;
  }[];
  image: string;
  inStock: boolean;
  category: string;
  featured?: boolean;
  createdAt?: string;
}

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
        <>
          {/* Mobile: scrollable row */}
          <div className="flex sm:hidden gap-4 overflow-x-auto pb-2">
            {displayedProducts.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className="min-w-[75vw] max-w-xs flex-shrink-0"
              >
                <ProductCollectionCard product={product} />
              </div>
            ))}
          </div>

          {/* Desktop: grid layout with lazy loading */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {displayedProducts.map((product, index) => (
                <ProductCollectionCard
                  key={product._id || product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

