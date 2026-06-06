import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategoryGrid from '@/components/home/CategoryGrid';
import AllProductsSection from '@/components/home/AllProductsSection';
import { getFeaturedProducts, getProducts } from '@/lib/actions/products';

// ISR: Revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  // Fetch products on the server
  const featuredProducts = await getFeaturedProducts();
  const { data: allProducts } = await getProducts();

  return (
    <div>
      <Hero />

      <FeaturedProducts products={featuredProducts.slice(0, 6)} />
      <CategoryGrid />
      <AllProductsSection products={allProducts} />

      {/* Promotional Banner */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 px-6 py-10 text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-600">
              Limited offer
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Free shipping above ₹2000
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Stock up on handcrafted treats, spices, and wellness staples—standard delivery is on us
              for all prepaid orders above ₹2000 across India.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
                🚚 Doorstep delivery pan-India
              </span>
              <span className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
                🎁 Free gift on prepaid orders
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
