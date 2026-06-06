import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/actions/products';
import ProductDetailInfo from '@/components/product/ProductDetailInfo';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '@/lib/structured-data';
import Script from 'next/script';

// ISR: Revalidate every hour, or on-demand via tag revalidation
export const revalidate = 3600;

type Props = {
  params: { slug: string };
};

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourstore.com';

export async function generateMetadata({ params }: Props) {
  const product = await getProductBySlug(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const productUrl = `${baseUrl}/products/${product.slug}`;
  const mainImage = product.images?.[0] || '';

  return {
    title: `${product.name} | ${process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce Store'}`,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      url: productUrl,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce Store',
      images: product.images && product.images.length > 0 
        ? product.images.map((img: string) => ({ url: img, width: 1200, height: 630 }))
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: mainImage ? [mainImage] : [],
    },
    alternates: {
      canonical: productUrl,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return notFound();
  }

  const productImages = product.images || [];

  // Generate structured data
  const productStructuredData = generateProductStructuredData(
    {
      name: product.name,
      description: product.description,
      images: productImages,
      price: product.price,
      comparePrice: product.comparePrice,
      inStock: product.inStock,
      slug: product.slug,
      category: product.category,
      ratings: product.ratings,
    },
    baseUrl
  );

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: baseUrl },
    ...(product.category
      ? [{ name: product.category, url: `${baseUrl}/category/${product.category}` }]
      : []),
    { name: product.name, url: `${baseUrl}/products/${product.slug}` },
  ]);

  return (
    <>
      {/* Structured Data */}
      <Script
        id="product-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData),
        }}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      <section className="py-12 md:py-16 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              {productImages.length > 0 ? (
                <ProductImageGallery images={productImages} productName={product.name} />
              ) : (
                <div className="w-full aspect-[4/5] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>
            <ProductDetailInfo
              product={{
                ...product,
                _id: product._id?.toString() || product._id,
                images: productImages,
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
