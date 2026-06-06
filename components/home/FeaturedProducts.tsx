import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCollectionCard } from '@/components/product/ProductCollectionCard';
import { Button } from '@/components/ui/button';

interface FeaturedProductsProps {
  products: Array<{
    _id?: string;
    id?: string;
    slug: string;
    name: string;
    price: number;
    comparePrice?: number;
    unitLabel?: string;
    variants?: Array<{
      label: string;
      price: number;
      comparePrice?: number;
      inStock?: boolean;
    }>;
    image: string;
    inStock: boolean;
    category?: string;
    featured?: boolean;
  }>;
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-slate-50/80">
      <div className="container px-2 sm:px-4 mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Best Sellers</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Featured Products</h2>
            <p className="text-sm text-slate-500 mt-1">
              Handpicked combos and staples loved by our community.
            </p>
          </div>
          <Link href="/products/featured" className="flex justify-end">
            <Button
              variant="outline"
              className="group rounded-full border-slate-300 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        <>
          {/* Mobile: scrollable row */}
          <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {products.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className="min-w-[62vw] sm:min-w-[48vw] max-w-[62vw] sm:max-w-[48vw] flex-shrink-0"
              >
                <ProductCollectionCard product={product} />
              </div>
            ))}
          </div>

          {/* Desktop: grid layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {products.map((product) => (
                <ProductCollectionCard
                  key={product._id || product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          </div>
        </>
      </div>
    </section>
  );
}
