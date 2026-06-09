import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';
import { getCategoryNameMap } from '@/lib/actions/categories';

const mapStatusToBucket = (status?: string) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'shipped') return 'shipped';
  if (normalized === 'delivered') return 'delivered';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  return 'pending';
};

type StatsOrderLineItem = {
  product?: string | { toString(): string };
  name?: string;
  quantity?: number;
  price?: number;
};

/** Lean order shape returned by the stats dashboard query. */
type StatsOrderLean = {
  _id?: { toString(): string };
  orderId?: string;
  status?: string;
  name?: string;
  email?: string;
  isProductionTest?: boolean;
  paymentInfo?: {
    method?: string;
    status?: string;
  };
  orderItems?: StatsOrderLineItem[];
  items?: StatsOrderLineItem[];
  totalPrice?: number;
  total?: number;
  createdAt?: Date | string;
  user?: { name?: string; email?: string } | null;
  customer?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    name?: string;
    email?: string;
  };
};

/**
 * Shared gate for revenue, units sold, and sales breakdowns.
 *
 * Orders By Status uses the full order set so admins still see cancelled,
 * failed, and abandoned checkouts. Sales metrics must not count those because
 * they would inflate revenue and units with orders that never completed as
 * valid business (cancelled, payment failed, unpaid online, or prod-test).
 */
const isCountableForAnalytics = (order: StatsOrderLean): boolean => {
  const status = (order.status || '').toLowerCase();
  if (status === 'cancelled' || status === 'canceled') return false;
  if (order.isProductionTest === true) return false;

  const paymentStatus = (order.paymentInfo?.status || '').toLowerCase();
  if (paymentStatus === 'failed') return false;

  const method = (order.paymentInfo?.method || '').toLowerCase();
  // COD is valid before payment is collected at delivery.
  if (method === 'cod') return true;

  // Online gateways only count after payment completes.
  return paymentStatus === 'completed';
};

const getOrderLineItems = (order: StatsOrderLean): StatsOrderLineItem[] =>
  Array.isArray(order.orderItems) && order.orderItems.length
    ? order.orderItems
    : Array.isArray(order.items) && order.items.length
      ? order.items
      : [];

const getOrderTotal = (order: StatsOrderLean) => order.totalPrice || order.total || 0;

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const CATEGORY_LABELS = await getCategoryNameMap();

    const [orders, totalUsers] = await Promise.all([
      Order.find().populate('user', 'name email').lean<StatsOrderLean[]>(),
      User.countDocuments(),
    ]);

    const totalOrders = orders.length;

    // Revenue, units, and sales charts share one filtered subset of orders.
    const analyticsOrders = orders.filter(isCountableForAnalytics);

    const totalRevenue = analyticsOrders.reduce(
      (acc, order) => acc + getOrderTotal(order),
      0
    );

    const orderLineItems: {
      productId?: string;
      name: string;
      quantity: number;
      price: number;
    }[] = [];

    analyticsOrders.forEach((order) => {
      getOrderLineItems(order).forEach((item) => {
        orderLineItems.push({
          productId: item.product ? item.product.toString() : undefined,
          name: item.name || 'Unknown product',
          quantity: item.quantity || 0,
          price: item.price || 0,
        });
      });
    });

    const productsSold = orderLineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const productIds = Array.from(
      new Set(orderLineItems.map((item) => item.productId).filter(Boolean))
    );
    const rawProductDocs = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select('name category quantity inStock')
          .lean()
      : [];
    const productDocs = rawProductDocs.map((product: any) => ({
      _id: product?._id?.toString?.() ?? '',
      name: product?.name || 'Unnamed product',
      category: product?.category,
      quantity: product?.quantity,
      inStock: product?.inStock,
    }));
    const productMap = productDocs.reduce<Record<string, (typeof productDocs)[number]>>(
      (acc, product) => {
        if (product._id) {
          acc[product._id] = product;
        }
        return acc;
      },
      {}
    );

    const salesByProductMap = new Map<
      string,
      { productId: string; name: string; category: string; quantity: number; revenue: number }
    >();
    orderLineItems.forEach((item) => {
      const key = item.productId || item.name;
      const productDoc = item.productId ? productMap[item.productId] : null;
      const categoryId = productDoc?.category || 'uncategorized';
      const displayCategory = CATEGORY_LABELS[categoryId] || categoryId || 'Uncategorized';
      const existing =
        salesByProductMap.get(key) || {
          productId: item.productId || key,
          name: productDoc?.name || item.name || 'Unknown product',
          category: displayCategory,
          quantity: 0,
          revenue: 0,
        };
      existing.quantity += item.quantity || 0;
      existing.revenue += (item.price || 0) * (item.quantity || 0);
      salesByProductMap.set(key, existing);
    });

    const salesByProduct = Array.from(salesByProductMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
    const topSellingProducts = salesByProduct.slice(0, 5);

    const salesByCategoryMap = new Map<
      string,
      { category: string; revenue: number; quantity: number }
    >();
    salesByProduct.forEach((entry) => {
      const category = entry.category || 'Uncategorized';
      const existing = salesByCategoryMap.get(category) || {
        category,
        revenue: 0,
        quantity: 0,
      };
      existing.revenue += entry.revenue;
      existing.quantity += entry.quantity;
      salesByCategoryMap.set(category, existing);
    });
    const salesByCategory = Array.from(salesByCategoryMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );

    const rawLowStockProducts = await Product.find({ quantity: { $lte: 10 } })
      .select('name quantity inStock category')
      .sort({ quantity: 1 })
      .limit(5)
      .lean();
    const lowStockProducts = rawLowStockProducts.map((product: any) => ({
      id: product?._id?.toString?.() ?? '',
      name: product?.name || 'Unnamed product',
      quantity: product?.quantity ?? 0,
      inStock: !!product?.inStock,
      category: CATEGORY_LABELS[product?.category] || product?.category || 'Uncategorized',
    }));

    const orderStatusCounts = {
      pending: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    const ordersByStatus: Record<
      'pending' | 'shipped' | 'delivered' | 'cancelled',
      { orderId: string; customer: string; email: string; total: number; createdAt: string }[]
    > = {
      pending: [],
      shipped: [],
      delivered: [],
      cancelled: [],
    };

    const MAX_STATUS_ENTRIES = 5;
    orders.forEach((order) => {
      const bucket = mapStatusToBucket(order.status) as keyof typeof orderStatusCounts;
      orderStatusCounts[bucket] += 1;

      if (ordersByStatus[bucket].length < MAX_STATUS_ENTRIES) {
        const customerName =
          order.user?.name ||
          order.shippingAddress?.name ||
          order.customer?.name ||
          order.name ||
          'Customer';
        const customerEmail =
          order.user?.email ||
          order.email ||
          order.customer?.email ||
          order.shippingAddress?.email ||
          '—';
        ordersByStatus[bucket].push({
          orderId: order.orderId || order._id?.toString() || '',
          customer: customerName,
          email: customerEmail,
          total: order.totalPrice || order.total || 0,
          createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
        });
      }
    });

    const monthlySalesMap = new Map<string, { name: string; sales: number }>();
    analyticsOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = monthlySalesMap.get(key) || { name: label, sales: 0 };
      existing.sales += getOrderTotal(order);
      monthlySalesMap.set(key, existing);
    });
    const salesData = Array.from(monthlySalesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, value]) => value);

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      productsSold,
      salesData,
      salesByProduct: salesByProduct.slice(0, 5),
      salesByCategory: salesByCategory.slice(0, 5),
      topSellingProducts,
      lowStockProducts,
      orderStatusCounts,
      ordersByStatus,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}