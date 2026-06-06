
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';

interface ProductCardProps {
  product: {
    id?: string;
    _id?: string;
    slug: string;
    name: string;
    price: number;
    comparePrice?: number;
    unitLabel?: string;
    variants?: {
      label: string;
      price: number;
      comparePrice?: number;
      inStock?: boolean;
    }[];
    image: string;
    inStock: boolean;
    category: string;
    featured?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const { addToCart } = useCart();

  const primaryVariant = product.variants?.[0];
  const variantAvailable = primaryVariant ? primaryVariant.inStock !== false : true;
  const displayPrice = primaryVariant?.price ?? product.price;
  const displayComparePrice =
    primaryVariant?.comparePrice ?? (product.comparePrice ?? undefined);
  const displayUnitLabel = primaryVariant?.label || product.unitLabel;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAddedToCart || !product.inStock || !variantAvailable) return;

    setIsAddedToCart(true);
    addToCart({
      id:
        (product.id || product._id || '') +
        (primaryVariant?.label ? `-${primaryVariant.label}` : ''),
      name: product.name,
      price: displayPrice,
      image: product.image || '/fallback.png',
      quantity: 1,
      unitLabel: displayUnitLabel,
      variantLabel: primaryVariant?.label,
    });
    toast.success('Added to cart');

    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm bg-white">
        {/* Product Image */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-lg bg-white">
          <Image
            src={product.image || '/fallback.png'}
            alt={product.name}
            fill
            className="object-contain p-4 rounded-t-lg"
            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
            loading="lazy"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />

          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Badge variant="outline" className="bg-background/90 text-base sm:text-lg py-2 px-4 font-semibold shadow-lg">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-1 p-2 sm:p-3">
          {/* Top content */}
          <div className="flex-1">
            <div className="text-[11px] sm:text-xs text-black mb-1 uppercase tracking-wide font-medium">
              {product.category}
            </div>
            <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 mb-2 min-h-[2.5rem] leading-tight group-hover:text-primary transition-colors text-black">
              {product.name}
            </h3>

            <div className="space-y-1 mb-2 text-center">
              <div className="flex items-baseline gap-2 justify-center">
                <span className="text-lg sm:text-xl font-bold text-emerald-600">
                  ₹{displayPrice.toFixed(2)}
                </span>
                {displayComparePrice && (
                  <span className="text-xs sm:text-sm text-slate-400 line-through">
                    ₹{displayComparePrice.toFixed(2)}
                  </span>
                )}
              </div>
              {displayUnitLabel && (
                <span className="text-xs text-slate-500 font-medium">
                  {displayUnitLabel}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button (always bottom) */}
          <Button
            className="w-full mt-auto h-8 sm:h-9 font-semibold rounded-lg text-xs sm:text-sm transition-all duration-300 hover:shadow-md bg-purple-600 text-white hover:bg-purple-700"
            variant={isAddedToCart ? 'outline' : undefined}
            disabled={!product.inStock || !variantAvailable || isAddedToCart}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart(e);
            }}
          >
            {isAddedToCart ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Added!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
