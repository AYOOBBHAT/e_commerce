'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
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
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
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
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-2">Handpicked favorites just for you</p>
          </div>
          <Link href="/products" className="mt-4 md:mt-0">
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
          <ProductGrid products={products} />
        )}
      </div>
    </section>
  );
}