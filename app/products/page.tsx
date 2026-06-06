import { getAllProducts } from '@/lib/actions/products';
import ProductListClient from '@/components/product/ProductListClient';

// ISR: Revalidate every hour, or on-demand via tag revalidation
export const revalidate = 3600;

export const metadata = {
  title: 'All Products',
  description: 'Browse our complete collection of farm-fresh staples, handmade treats, and wellness products.',
  openGraph: {
    title: 'All Products',
    description: 'Browse our complete collection of farm-fresh staples, handmade treats, and wellness products.',
  },
};

export default async function ProductsPage() {
  // Fetch products on the server (first page, 100 items for initial load)
  const products = await getAllProducts();

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">
              All collections
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Shop Everything</h1>
            <p className="text-sm text-slate-500 mt-1">
              Farm-fresh staples, handmade treats, origin spices, and more—curated for daily
              wellness.
            </p>
          </div>
        </div>

        {!products.length ? (
          <div className="p-6 text-center">No products found.</div>
        ) : (
          <ProductListClient products={products} />
        )}
      </div>
    </section>
  );
}
