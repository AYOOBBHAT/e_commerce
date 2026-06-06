import { getProductsByCategory } from '@/lib/actions/products';
import ProductListClient from '@/components/product/ProductListClient';
import { notFound } from 'next/navigation';

// ISR: Revalidate every hour, or on-demand via tag revalidation
export const revalidate = 3600;

type Props = {
  params: { category: string };
};

export async function generateMetadata({ params }: Props) {
  const category = params.category.replace(/-/g, ' ');
  return {
    title: `${category.charAt(0).toUpperCase() + category.slice(1)} Products`,
    description: `Discover curated picks from our ${category} collection.`,
  };
}

export default async function CategoryProductsPage({ params }: Props) {
  const category = params.category;
  const products = await getProductsByCategory(category);

  const title = category?.replace(/-/g, ' ') || 'Category';

  if (!products || products.length === 0) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Category</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 capitalize">{title}</h1>
            <p className="text-sm text-slate-500">
              Discover curated picks from the {title} collection.
            </p>
          </div>
          <div className="p-6 text-center">No products found in this category.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Category</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 capitalize">{title}</h1>
          <p className="text-sm text-slate-500">
            Discover curated picks from the {title} collection.
          </p>
        </div>
        <ProductListClient products={products} />
      </div>
    </section>
  );
}
