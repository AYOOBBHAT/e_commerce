import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { getServerSession } from '@/lib/auth';
import { invalidateProductCache } from '@/lib/actions/products';
import {
  getMainImageStatusLabel,
  sanitizeProductImageMeta,
  validateFeaturedProduct,
  type ProductImageMeta,
} from '@/lib/product-image-quality';
import {
  buildAdminProductSearchFilter,
  mergeProductFilters,
} from '@/lib/products/admin-search';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

type CategorySlugLean = {
  slug: string;
  name: string;
};

type AdminProductLean = {
  _id?: { toString(): string };
  name?: string;
  slug?: string;
  category?: string;
  images?: string[];
  imageMeta?: ProductImageMeta[];
  variants?: unknown[];
  featured?: boolean;
  price?: number;
  quantity?: number;
  inStock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type SerializedAdminProduct = AdminProductLean & {
  categoryName: string;
  variantCount: number;
  mainImageStatus: string;
};

function requireAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

async function buildCategoryNameMap() {
  const categories = await Category.find()
    .select('slug name')
    .lean<CategorySlugLean[]>();
  const map = new Map<string, string>(
    categories.map((category) => [category.slug, category.name]),
  );

  for (const category of PRODUCT_CATEGORIES) {
    if (!map.has(category.id)) {
      map.set(category.id, category.name);
    }
  }

  return map;
}

function serializeAdminProduct(
  product: AdminProductLean,
  categoryNameMap: Map<string, string>,
): SerializedAdminProduct {
  const categorySlug = product.category || '';
  return {
    ...product,
    categoryName: categoryNameMap.get(categorySlug) || categorySlug || '—',
    variantCount: Array.isArray(product.variants) ? product.variants.length : 0,
    mainImageStatus: getMainImageStatusLabel(
      product.images || [],
      product.imageMeta || [],
    ),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const authError = requireAdmin(session);
    if (authError) return authError;

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '20', 10), 100));
    const search = searchParams.get('search') || searchParams.get('q') || '';

    const categoryNameMap = await buildCategoryNameMap();
    let filter: Record<string, unknown> = {};

    if (search.trim()) {
      const escaped = search.trim().replace(/[-\\/^$*+?.()|[\]{}]/g, '\\$&');
      const nameRegex = new RegExp(escaped, 'i');
      const matchingSlugs = Array.from(categoryNameMap.entries())
        .filter(([, name]) => nameRegex.test(name))
        .map(([slug]) => slug);

      const searchQuery = buildAdminProductSearchFilter(search, matchingSlugs);
      filter = mergeProductFilters(filter, searchQuery);
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<AdminProductLean[]>();

    const data = products.map((product) =>
      serializeAdminProduct(product, categoryNameMap),
    );

    return NextResponse.json(
      { data, total, page, limit, totalPages },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const authError = requireAdmin(session);
    if (authError) return authError;

    await connectToDatabase();
    const data = await request.json();

    if (Array.isArray(data.imageMeta)) {
      data.imageMeta = sanitizeProductImageMeta(data.imageMeta);
    }

    const featuredError = validateFeaturedProduct({
      featured: Boolean(data.featured),
      images: data.images || [],
      imageMeta: data.imageMeta,
    });
    if (featuredError) {
      return NextResponse.json({ error: featuredError }, { status: 400 });
    }

    const product = await Product.create(data);
    try {
      revalidatePath('/products');
      revalidatePath('/products/featured');
      if (product?.slug) {
        revalidatePath(`/products/${product.slug}`);
        await invalidateProductCache(product.slug, product.category);
      }
      if (product?.category) {
        revalidatePath(`/category/${product.category}`);
      }
      revalidatePath('/');
    } catch (e) {
      console.warn('revalidatePath failed:', e);
    }
    return NextResponse.json(product, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'x-revalidated': `products,products/${product?.slug || ''}`,
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
