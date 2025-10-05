'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function AllProductsSection({ category }: { category?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        let data = await res.json();

        // Map images[0] → image for ProductCard compatibility
        data = data.map((p: any) => ({ ...p, image: p.images?.[0] || '' }));

        // Filter by category if provided
        if (category) {
          data = data.filter((p: any) => p.category === category);
        }

        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  return (
    <section className="py-12 md:py-16">
      <div className="container px-2 sm:px-4 mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-black">All Products</h2>
          <Link href="/products">
            <Button
              variant="outline"
              className="group bg-white text-black border border-gray-300 hover:bg-gray-100"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 text-black" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 text-center">Loading products...</div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">{error}</div>
        ) : !products.length ? (
          <div className="p-6 text-center">No products found.</div>
        ) : (
          <>
            {/* Mobile: scrollable row */}
            <div className="flex sm:hidden gap-4 overflow-x-auto pb-2">
              {products.map((product) => (
                <div
                  key={product._id || product.id || product.slug}
                  className="min-w-[70vw] max-w-xs flex-shrink-0"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Desktop: grid layout */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id || product.id || product.slug}
                    product={product}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
