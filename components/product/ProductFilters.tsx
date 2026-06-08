'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  availabilityFilter: 'all' | 'in';
  sortOption: 'newest' | 'priceLow' | 'priceHigh';
  onAvailabilityChange: (value: 'all' | 'in') => void;
  onSortChange: (value: 'newest' | 'priceLow' | 'priceHigh') => void;
  productCount: number;
}

const selectTriggerClass =
  'h-10 w-full rounded-xl border-stone-200 bg-white text-stone-900 shadow-sm focus:ring-[#B87333] sm:w-48';

export default function ProductFilters({
  availabilityFilter,
  sortOption,
  onAvailabilityChange,
  onSortChange,
  productCount,
}: ProductFiltersProps) {
  return (
    <div className="mb-6 rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-4 shadow-sm shadow-stone-900/[0.03] sm:mb-8 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B87333]">
            Filter &amp; Sort
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Showing{' '}
            <span className="font-semibold text-stone-900">{productCount}</span>{' '}
            {productCount === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <div className="flex min-w-[10rem] flex-col gap-1.5">
            <label
              htmlFor="availability-filter"
              className="text-xs font-medium text-stone-700"
            >
              Availability
            </label>
            <Select value={availabilityFilter} onValueChange={onAvailabilityChange}>
              <SelectTrigger id="availability-filter" className={selectTriggerClass}>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="border-stone-200 bg-white">
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="in">In stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex min-w-[10rem] flex-col gap-1.5">
            <label htmlFor="sort-filter" className="text-xs font-medium text-stone-700">
              Sort by
            </label>
            <Select value={sortOption} onValueChange={onSortChange}>
              <SelectTrigger id="sort-filter" className={selectTriggerClass}>
                <SelectValue placeholder="Newest" />
              </SelectTrigger>
              <SelectContent className="border-stone-200 bg-white">
                <SelectItem value="newest">Newest arrivals</SelectItem>
                <SelectItem value="priceLow">Price: Low to High</SelectItem>
                <SelectItem value="priceHigh">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
