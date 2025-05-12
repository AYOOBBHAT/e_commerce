import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

// Extended category data with images for display
const categoryData = [
  {
    ...PRODUCT_CATEGORIES[0], // Electronics
    image: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Latest gadgets and tech innovations'
  },
  {
    ...PRODUCT_CATEGORIES[1], // Clothing & Fashion
    image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Trendy apparel for all seasons'
  },
  {
    ...PRODUCT_CATEGORIES[2], // Home & Kitchen
    image: 'https://images.pexels.com/photos/6492403/pexels-photo-6492403.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Essentials for your living space'
  },
  {
    ...PRODUCT_CATEGORIES[3], // Books
    image: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    description: 'Expand your mind with our collection'
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-12 md:py-16 bg-muted">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">Browse our curated collections</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryData.map((category) => (
            <Link 
              key={category.id} 
              href={`/category/${category.id}`}
              className="group relative rounded-lg overflow-hidden flex h-[250px] shadow-sm transition-all hover:shadow-md"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5"></div>
              
              <div className="relative flex flex-col p-6 mt-auto">
                <h3 className="text-xl font-semibold text-white mb-1">{category.name}</h3>
                <p className="text-white/80 mb-4 text-sm">{category.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="self-start text-white border-white hover:bg-white hover:text-black transition-colors w-full justify-between group"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}