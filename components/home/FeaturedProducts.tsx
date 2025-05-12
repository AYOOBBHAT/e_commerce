import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ProductGrid from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';

// Mock featured products
const featuredProducts = [
  {
    id: '1',
    slug: 'premium-headphones',
    name: 'Premium Wireless Headphones',
    price: 149.99,
    comparePrice: 199.99,
    image: 'https://images.pexels.com/photos/3394665/pexels-photo-3394665.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    inStock: true,
    category: 'Electronics',
    featured: true,
  },
  {
    id: '2',
    slug: 'smartwatch-series-5',
    name: 'Smartwatch Series 5',
    price: 299.99,
    comparePrice: 349.99,
    image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    inStock: true,
    category: 'Electronics',
    featured: true,
  },
  {
    id: '3',
    slug: 'premium-leather-backpack',
    name: 'Premium Leather Backpack',
    price: 79.99,
    comparePrice: 99.99,
    image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    inStock: true,
    category: 'Fashion',
    featured: true,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-2">Handpicked favorites just for you</p>
          </div>
          <Link href="/products" className="mt-4 md:mt-0">
            <Button variant="outline" className="group">
              View All 
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        
        <ProductGrid products={featuredProducts} />
      </div>
    </section>
  );
}