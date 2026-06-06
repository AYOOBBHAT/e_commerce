// Structured data (JSON-LD) for SEO

export interface ProductStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image: string | string[];
  brand?: {
    '@type': string;
    name: string;
  };
  offers: {
    '@type': string;
    url: string;
    priceCurrency: string;
    price: string;
    availability: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
  };
}

export function generateProductStructuredData(product: {
  name: string;
  description: string;
  images: string[];
  price: number;
  comparePrice?: number;
  inStock: boolean;
  slug: string;
  category?: string;
  ratings?: Array<{ rating: number }>;
}, baseUrl: string): ProductStructuredData {
  const productUrl = `${baseUrl}/products/${product.slug}`;
  const mainImage = product.images?.[0] || '';
  const allImages = product.images || [mainImage];

  // Calculate average rating if available
  let aggregateRating;
  if (product.ratings && product.ratings.length > 0) {
    const avgRating = product.ratings.reduce((sum, r) => sum + r.rating, 0) / product.ratings.length;
    aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: product.ratings.length.toString(),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: allImages.length === 1 ? allImages[0] : allImages,
    brand: {
      '@type': 'Brand',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce Store',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price.toString(),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year
    },
    ...(aggregateRating && { aggregateRating }),
  };
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationStructuredData(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce Store',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@example.com',
    },
  };
}

export function generateWebsiteStructuredData(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'E-commerce Store',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

