import { Suspense } from 'react';
import { getAllProducts } from '@/lib/actions/products';
import SearchClient from '@/components/search/SearchClient';
import { Metadata } from 'next';

// ISR: Revalidate every hour
export const revalidate = 3600;

type Props = {
  searchParams: { q?: string; category?: string };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = searchParams.q || '';
  if (query) {
    return {
      title: `Search: ${query}`,
      description: `Search results for "${query}"`,
      robots: {
        index: true,
        follow: true,
      },
    };
  }
  return {
    title: 'Search Products',
    description: 'Search our catalog of products',
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchParams.q || '';
  const category = searchParams.category;

  // Pre-fetch initial results if query exists (for SSR)
  let initialResults: any[] = [];
  if (query && query.length >= 2) {
    try {
      initialResults = await getAllProducts({
        searchQuery: query,
        category: category || undefined,
        inStock: false,
      });
    } catch (error) {
      console.error('Search pre-fetch error:', error);
    }
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50 to-white min-h-screen">
      <div className="container mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Search</p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Find your favorites</h1>
          <p className="text-sm text-slate-500">
            Explore the catalog by product name, category, or description.
          </p>
        </div>

        <Suspense fallback={<div className="p-6 text-center">Loading search...</div>}>
          <SearchClient initialQuery={query} initialResults={initialResults} />
        </Suspense>
      </div>
    </section>
  );
}

