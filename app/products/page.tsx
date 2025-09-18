'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';

export default function ProductsPage() {
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
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">All Products</h1>
      {loading ? (
        <div className="p-6 text-center">Loading products...</div>
      ) : error ? (
        <div className="p-6 text-center text-destructive">{error}</div>
      ) : !products.length ? (
        <div className="p-6 text-center">No products found.</div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
