'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProductVariant = {
  id: string;
  label: string;
};

interface ProductShowcaseCardProps {
  product: {
    title: string;
    image: string;
    sellingPrice: number;
    originalPrice?: number;
    unitLabel?: string;
    variants?: ProductVariant[];
  };
}

export function ProductShowcaseCard({ product }: ProductShowcaseCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState(1);

  const discountPercent = useMemo(() => {
    if (!product.originalPrice || product.originalPrice <= product.sellingPrice) {
      return null;
    }
    return Math.round(
      ((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100
    );
  }, [product.originalPrice, product.sellingPrice]);

  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : prev));

  const increaseQuantity = () =>
    setQuantity((prev) => (prev < 10 ? prev + 1 : prev));

  return (
    <Card className="w-full max-w-3xl mx-auto rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/60 bg-white">
      <div className="grid gap-8 p-6 md:p-8 md:grid-cols-[1.15fr_1fr] items-center">
        {/* Product image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
            priority
          />
        </div>

        {/* Product info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge className="w-fit rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-100">
              Trending offer
            </Badge>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-snug">
              {product.title}
            </h2>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-baseline gap-3">
                {product.originalPrice && (
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-3xl font-bold text-emerald-600">
                  ₹{product.sellingPrice.toLocaleString('en-IN')}
                </span>
              </div>
              {discountPercent && (
                <Badge className="rounded-full bg-red-100 text-red-600 px-3 py-1">
                  -{discountPercent}%
                </Badge>
              )}
            </div>
            {product.unitLabel && (
              <p className="text-sm text-slate-500">Pack size: {product.unitLabel}</p>
            )}
          </div>

          {product.variants?.length ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Select variant</p>
              <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-slate-900/10">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {product.variants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">Quantity</p>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100"
                  onClick={decreaseQuantity}
                  aria-label="Decrease quantity"
                  disabled={quantity === 1}
                >
                  −
                </Button>
                <span className="w-10 text-center text-lg font-semibold text-slate-900">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-100"
                  onClick={increaseQuantity}
                  aria-label="Increase quantity"
                  disabled={quantity === 10}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-slate-400">Max 10 units</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 bg-emerald-600 hover:bg-emerald-500">
              Add to cart
            </Button>
            <p className="text-sm text-slate-500 text-center">
              Fast, secure checkout powered by Razorpay / PhonePe / Cashfree
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

