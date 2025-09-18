'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';

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
        // Map images[0] to image for compatibility with ProductCard
        data = data.map((p: any) => ({ ...p, image: p.images?.[0] || '' }));
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

  if (loading) return <div className="p-6 text-center">Loading products...</div>;
  if (error) return <div className="p-6 text-center text-destructive">{error}</div>;
  if (!products.length) return <div className="p-6 text-center">No products found.</div>;

  return <ProductGrid products={products} />;
}
