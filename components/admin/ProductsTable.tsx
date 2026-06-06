'use client';

import { useEffect, useState } from 'react';
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

export default function ProductsTable() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

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
      setProducts((prev) => prev.filter((p) => p._id !== productId && p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading products...</div>;
  if (error) return <div className="p-6 text-center text-destructive">{error}</div>;

  return (
    <div className="rounded-lg border-2 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900 min-w-[250px]">Product</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[150px]">Category</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Price</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[100px]">Stock</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Status</TableHead>
              <TableHead className="text-right font-semibold text-gray-900 min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                    <span className="text-gray-700 font-medium">{product.category || '—'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-semibold text-gray-900">₹{product.price?.toFixed(2) || '0.00'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-medium">{product.quantity ?? 0}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={product.inStock ? 'default' : 'destructive'}
                      className={product.inStock ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-700 hover:text-gray-900">
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
    </div>
  );
}