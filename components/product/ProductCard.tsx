 'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
      
      // Reset the button after 2 seconds
      setTimeout(() => {
        setIsAddedToCart(false);
      }, 2000);
    }
  };
  
  // Calculate discount percentage
  const discountPercentage = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) 
    : 0;
  
  return (
  <Link href={`/products/${product.slug}`} className="block h-full">
    <Card className="group overflow-hidden transition-all duration-300 h-full hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <div className="relative pt-[100%] overflow-hidden rounded-t-lg" style={{ position: 'relative' }}>
        {/* Product Image */}
        <Image
  src={getOptimizedCloudinaryUrl(product.image || '/fallback.png', 400)}
  alt={product.name}
  fill
  className="object-cover transition-transform duration-500 group-hover:scale-110"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
        {/* Quick Actions */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
            onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddToWishlist(e); }}
          >
            <Heart
              className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
            />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
            onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.href = `/products/${product.slug}`; }}
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-destructive text-white font-semibold shadow-lg">
            -{discountPercentage}%
          </Badge>
        )}
        {/* Featured Badge */}
        {product.featured && (
          <Badge className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-primary text-white font-semibold shadow-lg">
            Featured
          </Badge>
        )}
        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="outline" className="bg-background/90 text-base sm:text-lg py-2 px-4 font-semibold shadow-lg">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-muted-foreground mb-1 uppercase tracking-wide font-medium">{product.category}</div>
        <h3 className="text-sm sm:text-base font-semibold line-clamp-2 mb-3 min-h-[2.5rem] sm:min-h-[3rem] leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
          {product.comparePrice && (
            <span className="text-sm text-muted-foreground line-through">
              ₹{product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          className="w-full h-9 sm:h-10 font-semibold rounded-lg transition-all duration-300 hover:shadow-md"
          variant={isAddedToCart ? "outline" : "default"}
          disabled={!product.inStock || isAddedToCart}
          onClick={e => { e.preventDefault(); e.stopPropagation(); handleAddToCart(e); }}
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
      </CardFooter>
    </Card>
  </Link>
  );
}