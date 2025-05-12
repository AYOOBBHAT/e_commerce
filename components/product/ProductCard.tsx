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

interface ProductCardProps {
  product: {
    id: string;
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
    <Card className="group overflow-hidden transition-all duration-300 h-full hover:shadow-md">
      <Link href={`/products/${product.slug}`}>
        <div className="relative pt-[100%]">
          {/* Product Image */}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleAddToWishlist}
            >
              <Heart 
                className={`h-4 w-4 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} 
              />
            </Button>
            <Link href={`/products/${product.slug}`}>
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <Badge className="absolute top-3 left-3 bg-destructive">
              -{discountPercentage}%
            </Badge>
          )}
          
          {/* Featured Badge */}
          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-primary">
              Featured
            </Badge>
          )}
          
          {/* Out of Stock Overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="outline" className="bg-background/80 text-lg py-1 px-3">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-1">{product.category}</div>
          <h3 className="text-base font-medium line-clamp-2 mb-2 min-h-[3rem]">{product.name}</h3>
          <div className="flex items-center">
            <span className="text-lg font-semibold">${product.price.toFixed(2)}</span>
            {product.comparePrice && (
              <span className="text-sm text-muted-foreground line-through ml-2">
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full"
          variant={isAddedToCart ? "outline" : "default"}
          disabled={!product.inStock || isAddedToCart}
          onClick={handleAddToCart}
        >
          {isAddedToCart ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}