'use client';

import { useEffect, useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import ProductCard from '@/components/product/ProductCard';

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

  if (loading) return <div className="p-6 text-center">Loading products...</div>;
  if (error) return <div className="p-6 text-center text-destructive">{error}</div>;
  if (!products.length) return <div className="p-6 text-center">No products found.</div>;

  return (
    <section className="py-12 md:py-16">
      <div className="container px-2 sm:px-4 mx-auto">
        {/* Title + View All */}
        <div className="flex justify-between items-center mb-8 w-full">
          <h2 className="text-2xl md:text-3xl font-bold text-black">All Products</h2>
          <a href="/products">
            <button className="border rounded px-4 py-2 bg-white text-black font-semibold shadow border-gray-200 hover:bg-gray-100">
              View All <span className="ml-2 text-black">→</span>
            </button>
          </a>
        </div>

        {/* Horizontal scroll */}
        <div className="overflow-x-auto pb-2 -mx-2 sm:-mx-4">
          <div className="flex gap-4 px-2 sm:px-4 w-full">
            {products.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className="min-w-[60vw] sm:min-w-[220px] max-w-xs flex-shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
