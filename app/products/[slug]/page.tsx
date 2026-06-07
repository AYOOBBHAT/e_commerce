import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/actions/products';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductBuyBox from '@/components/product/pdp/ProductBuyBox';
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

      <section className="bg-[#FAF7F2] py-10 pb-28 md:py-14 md:pb-14 lg:pb-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div>
              {productImages.length > 0 ? (
                <ProductImageGallery images={productImages} productName={product.name} />
              ) : (
                <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
                  No image available
                </div>
              )}
            </div>
            <ProductBuyBox
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
