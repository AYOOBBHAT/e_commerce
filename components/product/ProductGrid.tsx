import ProductCard from './ProductCard';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  inStock: boolean;
  category: string;
  featured?: boolean;
}

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
}

export default function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  let gridClass = 'grid-cols-1 sm:grid-cols-2';
  
  switch (columns) {
    case 2:
      gridClass = 'grid-cols-1 sm:grid-cols-2';
      break;
    case 3:
      gridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      break;
    case 4:
      gridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      break;
  }
  
  return (
    <div className={`grid ${gridClass} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}