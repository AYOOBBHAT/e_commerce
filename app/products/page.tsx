import { getAllProducts } from '@/lib/actions/products';
import ProductListClient from '@/components/product/ProductListClient';
import ProductListingHeader from '@/components/product/ProductListingHeader';

export const revalidate = 3600;

export const metadata = {
  title: 'All Products',
  description:
    'Browse our complete collection of farm-fresh staples, handmade treats, and wellness products.',
  openGraph: {
    title: 'All Products',
    description:
      'Browse our complete collection of farm-fresh staples, handmade treats, and wellness products.',
  },
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-14 lg:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ProductListingHeader
          title="All Products"
          description="Farm-fresh staples, handmade treats, origin spices, and more—curated for daily wellness."
        />

        {!products.length ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white px-6 py-12 text-center text-sm text-stone-600">
            No products found.
          </div>
        ) : (
          <ProductListClient products={products} />
        )}
      </div>
    </section>
  );
}
