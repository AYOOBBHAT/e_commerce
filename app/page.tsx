import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategoryGrid from '@/components/home/CategoryGrid';

export default function Home() {
  return (
    <div>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      
      {/* Promotional Banner */}
      <section className="py-12 md:py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Free Shipping on Orders Over $50</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Shop now and enjoy free standard shipping on all orders over $50. Offer valid for domestic orders only.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}