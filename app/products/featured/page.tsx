import { getAllProducts } from '@/lib/actions/products'
import ProductListClient from '@/components/product/ProductListClient'
import ProductListingHeader from '@/components/product/ProductListingHeader'

export const revalidate = 3600

export const metadata = {
  title: 'Featured Products',
  description:
    'Handpicked best sellers, dry fruits, and wellness staples the community loves most.',
  openGraph: {
    title: 'Featured Products',
    description:
      'Handpicked best sellers, dry fruits, and wellness staples the community loves most.',
  },
}

export default async function FeaturedProductsPage() {
  const products = await getAllProducts({ featured: true })

  return (
    <section className="bg-[#FAF7F2] py-10 sm:py-14 lg:py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ProductListingHeader
          title="Featured Products"
          description="Handpicked combos, dry fruits, and wellness staples the community loves most."
        />

        {!products.length ? (
          <div className="rounded-2xl border border-stone-200/80 bg-white px-6 py-12 text-center text-sm text-stone-600">
            No featured products found.
          </div>
        ) : (
          <ProductListClient products={products} />
        )}
      </div>
    </section>
  )
}
