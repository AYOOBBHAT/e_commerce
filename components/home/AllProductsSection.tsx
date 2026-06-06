import { ProductCollectionCard } from '@/components/product/ProductCollectionCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface AllProductsSectionProps {
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

export default function AllProductsSection({ products }: AllProductsSectionProps) {

  return (
    <section className="py-12 md:py-16 bg-slate-50/80">
      <div className="container px-2 sm:px-4 mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Shop Everything</p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">All Products</h2>
            <p className="text-sm text-slate-500 mt-1">
              Authentic staples across categories, delivered pan-India.
            </p>
          </div>
          <Link href="/products">
            <Button
              variant="outline"
              className="group rounded-full border-slate-300 bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
            >
              View Store
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">
          Showing {products.length} products
        </div>

        {/* Content */}
        {!products.length ? (
          <div className="p-6 text-center">No products found.</div>
        ) : (
          <>
            {/* Mobile: scrollable row */}
            <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-2 px-2">
              {products.slice(0, 8).map((product) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {products.slice(0, 8).map((product) => (
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
