'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';

export default function CategoryProductsPage() {
  const params = useParams();
  const category = params?.category as string;
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
        let data = await res.json();
        data = data.filter((p: any) => p.category === category);
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    if (category) fetchProducts();
  }, [category]);

  if (loading) return <div className="p-6 text-center">Loading products...</div>;
  if (error) return <div className="p-6 text-center text-destructive">{error}</div>;
  if (!products.length) return <div className="p-6 text-center">No products found in this category.</div>;

  return (
    <div className="container mx-auto px-4 py-12 bg-white text-black rounded-lg shadow-sm">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 capitalize text-black bg-white w-full py-2" style={{ color: '#000' }}>{category} Products</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id || product.id || product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
