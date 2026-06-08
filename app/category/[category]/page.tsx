import { getProductsByCategory } from '@/lib/actions/products';
import ProductListClient from '@/components/product/ProductListClient';
import ProductListingHeader from '@/components/product/ProductListingHeader';

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
  const title = category?.replace(/-/g, ' ') || 'Collection';

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-14 lg:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ProductListingHeader
          eyebrow="Collection"
          title={title}
          description={`Curated picks from our ${title} range.`}
        />

        {!products || products.length === 0 ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white px-6 py-12 text-center text-sm text-stone-600">
            No products found in this collection.
          </div>
        ) : (
          <ProductListClient products={products} />
        )}
      </div>
    </section>
  );
}
