
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Check } from 'lucide-react'; // 👈 Eye removed
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary';
import { useCart } from '@/components/CartProvider';

interface ProductCardProps {
  product: {
    id?: string;
    _id?: string;
    slug: string;
    name: string;
    price: number;
    comparePrice?: number;
    image: string;
    inStock: boolean;
    category: string;
    featured?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const { addToCart } = useCart();

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);

    if (!isWishlisted) {
      toast.success('Added to wishlist');
    } else {
      toast.info('Removed from wishlist');
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAddedToCart) {
      setIsAddedToCart(true);
      addToCart({
        id: product.id || product._id || '',
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
      toast.success('Added to cart');

      setTimeout(() => {
        setIsAddedToCart(false);
      }, 2000);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="block h-full">
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm bg-white">
        {/* Product Image */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-lg bg-white">
          <Image
            src={getOptimizedCloudinaryUrl(product.image || '/fallback.png', 400)}
            alt={product.name}
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 25vw"
          />

          {/* Wishlist */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToWishlist(e);
              }}
            >
              <Heart
                className={`h-3.5 w-3.5 ${
                  isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>

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

            <div className="flex items-center gap-2 justify-center mb-2">
              <span className="text-base sm:text-lg font-bold text-primary">
                ₹{product.price.toFixed(2)}
              </span>
              {product.comparePrice && (
                <span className="text-xs sm:text-sm text-gray-500 line-through">
                  ₹{product.comparePrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button (always bottom) */}
          <Button
            className="w-full mt-auto h-8 sm:h-9 font-semibold rounded-lg text-xs sm:text-sm transition-all duration-300 hover:shadow-md bg-purple-600 text-white hover:bg-purple-700"
            variant={isAddedToCart ? 'outline' : undefined}
            disabled={!product.inStock || isAddedToCart}
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
