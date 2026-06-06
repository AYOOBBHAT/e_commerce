'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  availabilityFilter: 'all' | 'in' | 'out';
  sortOption: 'newest' | 'priceLow' | 'priceHigh';
  onAvailabilityChange: (value: 'all' | 'in' | 'out') => void;
  onSortChange: (value: 'newest' | 'priceLow' | 'priceHigh') => void;
  productCount: number;
}

export default function ProductFilters({
  availabilityFilter,
  sortOption,
  onAvailabilityChange,
  onSortChange,
  productCount,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm mb-8 text-sm text-slate-600">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
        Filter & sort
      </div>
      <div className="flex flex-1 flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Availability</span>
          <Select value={availabilityFilter} onValueChange={onAvailabilityChange}>
            <SelectTrigger className="w-48 rounded-full bg-slate-50 border-slate-200">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="in">In stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Sort by</span>
          <Select value={sortOption} onValueChange={onSortChange}>
            <SelectTrigger className="w-48 rounded-full bg-slate-50 border-slate-200">
              <SelectValue placeholder="Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest arrivals</SelectItem>
              <SelectItem value="priceLow">Price: Low to High</SelectItem>
              <SelectItem value="priceHigh">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-900">{productCount}</span> items
      </div>
    </div>
  );
}

