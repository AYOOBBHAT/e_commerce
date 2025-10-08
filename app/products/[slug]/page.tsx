import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import ProductCard from '@/components/product/ProductCard';
import mongoose from 'mongoose';

export const revalidate = 30; // seconds

type Props = {
  params: { slug: string };
};

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function ProductPage({ params }: Props) {
  const { slug } = params;
  await connectToDatabase();

  // Try several lookup strategies to avoid 404s caused by encoding/casing/id
  let product: any = null;

  try {
    product = await Product.findOne({ slug }).lean();

    if (!product) {
      const decoded = decodeURIComponent(slug);
      if (decoded !== slug) {
        product = await Product.findOne({ slug: decoded }).lean();
      }
    }

    if (!product) {
      // case-insensitive slug match
      const re = new RegExp('^' + escapeRegex(slug) + '$', 'i');
      product = await Product.findOne({ slug: re }).lean();
    }

    if (!product && mongoose.isValidObjectId(slug)) {
      // maybe the URL used the _id instead of slug
      product = await Product.findById(slug).lean();
    }
  } catch (err) {
    console.error('Error looking up product by slug:', slug, err);
  }

  if (!product) {
    console.warn('Product not found for slug:', slug);
    return notFound();
  }

  // Map images[0] to image for ProductCard compatibility
  const productForCard = { ...product, image: product.images?.[0] || '' };

  return (
    <div className="container mx-auto px-4 py-12 bg-white text-black rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Image + details could be expanded here */}
          <img src={productForCard.image} alt={product.name} className="w-full h-auto object-cover rounded-md" />
          <h1 className="text-2xl font-bold mt-4">{product.name}</h1>
          <p className="mt-2 text-gray-700">{product.description}</p>
        </div>
        <aside>
          <ProductCard product={productForCard as any} />
        </aside>
      </div>
    </div>
  );
}
