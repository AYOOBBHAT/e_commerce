import ProductCard, { type ProductCardProduct } from './ProductCard'

interface ProductGridProps {
  products: ProductCardProduct[]
  columns?: 2 | 3 | 4
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
    <div className={`grid ${gridClass} gap-3 sm:gap-4 lg:gap-5`}>
      {products.map((product) => (
        <ProductCard key={product._id || product.id || product.slug} product={product} />
      ))}
    </div>
  );
}
