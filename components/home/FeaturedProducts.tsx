'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function FeaturedProducts() {
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
        // Map images[0] to image for compatibility with ProductCard
        data = data.map((p: any) => ({ ...p, image: p.images?.[0] || '' }));
        setProducts(data.filter((p: any) => p.featured));
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <section className="py-12 md:py-16">
      <div className="container px-2 sm:px-4 mx-auto">
        <div className="flex items-center justify-between mb-8 w-full">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-black bg-white w-full py-2">Featured Products</h2>
            <p className="mt-2 text-black bg-white w-full py-1">Handpicked favorites just for you</p>
          </div>
          <Link href="/products" className="ml-2">
            <Button variant="outline" className="group">
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading products...</div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">{error}</div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-2 sm:-mx-4">
            <div className="flex gap-4 px-2 sm:px-4 w-full">
              {products.map((product) => (
                <div key={product._id || product.id || product.slug} className="min-w-[70vw] sm:min-w-[220px] max-w-xs flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}