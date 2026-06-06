'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/components/CartProvider';

type Variant = {
  label: string;
  price: number;
  comparePrice?: number;
  inStock?: boolean;
};

interface ProductDetailInfoProps {
  product: {
    _id: string;
    name: string;
    description: string;
    images?: string[];
    price: number;
    comparePrice?: number;
    unitLabel?: string;
    variants?: Variant[];
    inStock: boolean;
  };
}

export default function ProductDetailInfo({ product }: ProductDetailInfoProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantLabel, setSelectedVariantLabel] = useState(
    product.variants?.[0]?.label || ''
  );

  const activeVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    return product.variants.find((variant) => variant.label === selectedVariantLabel) ?? null;
  }, [product.variants, selectedVariantLabel]);

  const price = activeVariant?.price ?? product.price;
  const comparePrice = activeVariant?.comparePrice ?? product.comparePrice;
  const unitLabel = activeVariant?.label ?? product.unitLabel;
  const isVariantInStock =
    activeVariant?.inStock ?? (product.variants?.length ? true : product.inStock);
  const isAvailable = product.inStock && isVariantInStock;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart({
      id: product._id + (activeVariant?.label ? `-${activeVariant.label}` : ''),
      name: product.name,
      price,
      quantity,
      image: product.images?.[0] || '/fallback.png',
      unitLabel: unitLabel,
      variantLabel: activeVariant?.label,
    });
    setQuantity(1);
  };

  const decreaseQuantity = () =>
    setQuantity((prev) => (prev > 1 ? prev - 1 : prev));
  const increaseQuantity = () =>
    setQuantity((prev) => (prev < 10 ? prev + 1 : prev));

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">{product.name}</h1>
        {unitLabel && <p className="text-sm text-slate-500">{unitLabel}</p>}
        <div className="flex items-baseline gap-3">
          {comparePrice && comparePrice > price && (
            <span className="text-base text-slate-400 line-through">
              ₹{comparePrice.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-4xl font-bold text-emerald-600">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {comparePrice && comparePrice > price && (
            <span className="text-sm text-emerald-600 font-semibold">
              Save ₹{(comparePrice - price).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
        {product.description}
      </p>

      {product.variants?.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Select pack size</p>
          <Select
            value={selectedVariantLabel}
            onValueChange={setSelectedVariantLabel}
          >
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
              <SelectValue placeholder="Choose variant" />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((variant) => (
                <SelectItem key={variant.label} value={variant.label}>
                  {variant.label} · ₹{variant.price.toLocaleString('en-IN')}
                  {variant.inStock === false ? ' (Out of stock)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-inner">
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition disabled:opacity-40"
            onClick={decreaseQuantity}
            disabled={quantity === 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-semibold text-slate-900">
            {quantity}
          </span>
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-slate-200 text-slate-700 hover:bg-white transition"
            onClick={increaseQuantity}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          className="w-full h-12 rounded-full bg-emerald-600 text-white font-semibold text-base hover:bg-emerald-500 disabled:opacity-50"
          onClick={handleAddToCart}
          disabled={!isAvailable}
        >
          {isAvailable ? 'Add to Cart' : 'Out of Stock'}
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Secure checkout powered by Razorpay · PhonePe · Cashfree
        </p>
      </div>
    </div>
  );
}

