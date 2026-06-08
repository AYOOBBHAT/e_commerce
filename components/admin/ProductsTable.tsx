'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const DEFAULT_LIMIT = 20;

export default function ProductsTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchProducts = useCallback(
    async (p = page, l = limit, search = searchFilter) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({
          page: String(p),
          limit: String(l),
        });
        if (search.trim()) qs.set('search', search.trim());

        const res = await fetch(`/api/admin/products?${qs.toString()}`);
        if (!res.ok) {
          if (res.status === 403) throw new Error('Forbidden');
          if (res.status === 401) throw new Error('Unauthorized');
          throw new Error('Failed to fetch products');
        }
        const json = await res.json();
        setProducts(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, searchFilter],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
      const nextTotal = total - 1;
      const nextPage =
        products.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await fetchProducts(nextPage, limit, searchFilter);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && products.length === 0 && !error) {
    return <div className="p-6 text-center">Loading products...</div>;
  }

  return (
    <div className="rounded-lg border-2 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900 min-w-[250px]">Product</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Category</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[90px]">Featured</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[80px]">Variants</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Image Status</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Price</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[100px]">Stock</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-900 min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id || product.id} className="hover:bg-gray-50">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                        <Image
                          src={product.images?.[0] || product.image || '/placeholder.png'}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">
                          ID: {(product._id || product.id).toString().slice(-8)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-medium">
                      {product.categoryName || product.category || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant={product.featured ? 'default' : 'outline'}
                      className={
                        product.featured
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : ''
                      }
                    >
                      {product.featured ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-medium">
                      {product.variantCount ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-sm text-gray-700">
                      {product.mainImageStatus || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-semibold text-gray-900">
                      ₹{product.price?.toFixed(2) || '0.00'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-medium">{product.quantity ?? 0}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant={product.inStock ? 'default' : 'destructive'}
                      className={
                        product.inStock
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : ''
                      }
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-100 text-gray-700 hover:text-gray-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-2 shadow-lg">
                        <DropdownMenuItem asChild className="hover:bg-gray-100">
                          <Link
                            href={`/admin/products/${product._id || product.id}/edit`}
                            className="flex items-center text-gray-900"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(product._id || product.id)}
                          disabled={isDeleting}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm text-muted-foreground">Total: {total}</div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Search</label>
            <input
              className="border rounded px-2 py-1 min-w-[220px]"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Name, slug, ID, or category"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  fetchProducts(1, limit, searchFilter);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Per page</label>
            <select
              value={limit}
              onChange={(e) => {
                const nextLimit = parseInt(e.target.value, 10);
                setLimit(nextLimit);
                setPage(1);
                fetchProducts(1, nextLimit, searchFilter);
              }}
              className="border rounded px-2 py-1"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => {
              setPage(1);
              fetchProducts(1, limit, searchFilter);
            }}
          >
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSearchFilter('');
              setPage(1);
              fetchProducts(1, limit, '');
            }}
          >
            Clear
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            onClick={() => {
              if (page > 1) {
                const prev = page - 1;
                setPage(prev);
                fetchProducts(prev, limit, searchFilter);
              }
            }}
            disabled={page <= 1 || loading}
          >
            Prev
          </Button>
          <CompactPager
            page={page}
            totalPages={totalPages}
            onPage={(p) => {
              setPage(p);
              fetchProducts(p, limit, searchFilter);
            }}
          />
          <Button
            onClick={() => {
              if (page < totalPages) {
                const next = page + 1;
                setPage(next);
                fetchProducts(next, limit, searchFilter);
              }
            }}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function CompactPager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
      return result;
    }
    result.push(1);
    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);
    if (left > 2) result.push('...');
    for (let i = left; i <= right; i++) result.push(i);
    if (right < totalPages - 1) result.push('...');
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex gap-1 items-center">
      {pages.map((p, idx) =>
        typeof p === 'number' ? (
          <button
            key={idx}
            type="button"
            onClick={() => onPage(p)}
            className={`px-2 py-1 rounded ${p === page ? 'bg-primary text-white' : 'bg-transparent'}`}
          >
            {p}
          </button>
        ) : (
          <span key={idx} className="px-2">
            …
          </span>
        ),
      )}
    </div>
  );
}
