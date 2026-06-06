"use client";

import { useEffect, useState } from "react";
import { ProductCollectionCard } from "@/components/product/ProductCollectionCard";

export default function FeaturedProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        let data = await res.json();
        // Map images[0] to image for compatibility with ProductCard
        data = data.map((p: any) => ({ ...p, image: p.images?.[0] || "" }));
        setProducts(data.filter((p: any) => p.featured));
      } catch (err: any) {
        setError(err.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-emerald-50/40 via-white to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Best sellers</p>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Featured Products</h1>
              <p className="text-sm text-slate-500 mt-1">
                Handpicked combos, dry fruits, and wellness staples the community loves most.
              </p>
            </div>
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-900">{products.length}</span> picks
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading products...</div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">{error}</div>
          ) : !products.length ? (
            <div className="p-6 text-center">No featured products found.</div>
          ) : (
            <>
              <div className="flex sm:hidden gap-4 overflow-x-auto pb-2">
                {products.map((product) => (
                  <div
                    key={product._id || product.id || product.slug}
                    className="min-w-[75vw] max-w-xs flex-shrink-0"
                  >
                    <ProductCollectionCard product={product} />
                  </div>
                ))}
              </div>

              <div className="hidden sm:block">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
                  {products.map((product) => (
                    <ProductCollectionCard
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
