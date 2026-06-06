'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCollectionCard } from '@/components/product/ProductCollectionCard';
import { useDebouncedCallback } from 'use-debounce';
import { useEffect, useState, useTransition } from 'react';

interface SearchClientProps {
  initialQuery?: string;
  initialResults?: any[];
}

export default function SearchClient({ initialQuery = '', initialResults = [] }: SearchClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Debounced search function (300ms delay)
  const debouncedSearch = useDebouncedCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setResults(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    300 // 300ms debounce
  );

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    setQuery(currentQuery);

    if (currentQuery && currentQuery.length >= 2) {
      startTransition(() => {
        debouncedSearch(currentQuery);
      });
    } else {
      setResults([]);
    }
  }, [searchParams, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed && trimmed.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const displayResults = loading ? [] : results;
  const isLoading = loading || isPending;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-center max-w-2xl mx-auto"
      >
        <Input
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(e) => {
            const newQuery = e.target.value;
            setQuery(newQuery);
            if (newQuery.length >= 2) {
              startTransition(() => {
                debouncedSearch(newQuery);
              });
            } else {
              setResults([]);
            }
          }}
          className="h-12 rounded-full px-5 bg-white border-slate-200"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-base font-semibold"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </form>

      {isLoading ? (
        <div className="p-6 text-center">Searching catalog...</div>
      ) : error ? (
        <div className="p-6 text-center text-destructive">{error}</div>
      ) : !query || query.length < 2 ? (
        <div className="p-6 text-center text-slate-500">
          Start typing to search the catalog (minimum 2 characters).
        </div>
      ) : displayResults.length === 0 ? (
        <div className="p-6 text-center">No products found for &ldquo;{query}&rdquo;.</div>
      ) : (
        <>
          <div className="flex sm:hidden gap-4 overflow-x-auto pb-2">
            {displayResults.map((product) => (
              <div
                key={product._id || product.id || product.slug}
                className="min-w-[75vw] max-w-xs flex-shrink-0"
              >
                <ProductCollectionCard product={product} />
              </div>
            ))}
          </div>
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
              {displayResults.map((product) => (
                <ProductCollectionCard
                  key={product._id || product.id || product.slug}
                  product={product}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

