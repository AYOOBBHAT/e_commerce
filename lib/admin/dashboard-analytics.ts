import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { getCategoryNameMap } from '@/lib/actions/categories';
import {
  buildAdminPendingStatusFilter,
  type DashboardStatusBucket,
} from '@/lib/admin/order-status-filters';

/** Lean shape for recent-order samples (limited queries with populate). */
type StatsOrderSampleLean = {
  _id?: { toString(): string };
  orderId?: string;
  name?: string;
  email?: string;
  totalPrice?: number;
  total?: number;
  createdAt?: Date | string;
  user?: { name?: string; email?: string } | null;
  customer?: {
    name?: string;
    email?: string;
  };
  shippingAddress?:
    | string
    | {
        name?: string;
        email?: string;
        raw?: string;
      };
};

type StatsProductLean = {
  _id?: { toString(): string };
  name?: string;
  category?: string;
  quantity?: number;
  inStock?: boolean;
};

type ProductSalesRow = {
  _id: string;
  productObjectId?: { toString(): string };
  name: string;
  quantity: number;
  revenue: number;
};

type MonthlySalesRow = {
  _id: { year: number; month: number };
  sales: number;
};

type FacetResult = {
  revenue: { total: number }[];
  productsSold: { total: number }[];
  productSales: ProductSalesRow[];
  monthlySales: MonthlySalesRow[];
  statusCounts: {
    pending: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    confirmed: number;
    total: number;
  }[];
};

export type DashboardStatsPayload = {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  productsSold: number;
  salesData: { name: string; sales: number }[];
  salesByProduct: {
    productId: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
  salesByCategory: { category: string; revenue: number; quantity: number }[];
  topSellingProducts: {
    productId: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    quantity: number;
    inStock: boolean;
    category: string;
  }[];
  orderStatusCounts: Record<DashboardStatusBucket, number>;
  ordersByStatus: Record<
    DashboardStatusBucket,
    { orderId: string; customer: string; email: string; total: number; createdAt: string }[]
  >;
};

/**
 * MongoDB match for revenue, units sold, and sales breakdowns.
 * Mirrors the former in-memory isCountableForAnalytics gate.
 */
export function buildAnalyticsOrderMatch(): Record<string, unknown> {
  return {
    status: { $nin: ['cancelled', 'canceled'] },
    isProductionTest: { $ne: true },
    'paymentInfo.status': { $ne: 'failed' },
    $or: [{ 'paymentInfo.method': 'cod' }, { 'paymentInfo.status': 'completed' }],
  };
}

const ORDER_TOTAL_FIELD = {
  orderTotal: { $ifNull: ['$totalPrice', { $ifNull: ['$total', 0] }] },
};

const LINE_ITEMS_FIELD = {
  lineItems: {
    $cond: {
      if: { $gt: [{ $size: { $ifNull: ['$orderItems', []] } }, 0] },
      then: '$orderItems',
      else: { $ifNull: ['$items', []] },
    },
  },
};

const analyticsMatch = buildAnalyticsOrderMatch();

const toLeanIdString = (value?: { toString(): string }) =>
  value ? value.toString() : '';

const toIsoDateString = (value?: Date | string): string => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const shippingAddressField = (
  address: StatsOrderSampleLean['shippingAddress'],
  field: 'name' | 'email',
): string | undefined => {
  if (!address || typeof address === 'string') return undefined;
  return address[field];
};

const resolveCustomerName = (order: StatsOrderSampleLean): string =>
  order.user?.name ||
  shippingAddressField(order.shippingAddress, 'name') ||
  order.customer?.name ||
  order.name ||
  'Customer';

const resolveCustomerEmail = (order: StatsOrderSampleLean): string =>
  order.user?.email ||
  order.email ||
  order.customer?.email ||
  shippingAddressField(order.shippingAddress, 'email') ||
  '—';

const getOrderTotal = (order: StatsOrderSampleLean) => order.totalPrice ?? order.total ?? 0;

const isNonEmptyString = (value: string | undefined): value is string =>
  typeof value === 'string' && value.length > 0;

function formatMonthLabel(year: number, month: number): string {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function buildSalesData(monthlyRows: MonthlySalesRow[]): { name: string; sales: number }[] {
  const sorted = [...monthlyRows].sort((a, b) => {
    if (a._id.year !== b._id.year) return a._id.year - b._id.year;
    return a._id.month - b._id.month;
  });

  return sorted.slice(-6).map((row) => ({
    name: formatMonthLabel(row._id.year, row._id.month),
    sales: row.sales,
  }));
}

function mapSampleOrder(order: StatsOrderSampleLean) {
  return {
    orderId: order.orderId || toLeanIdString(order._id),
    customer: resolveCustomerName(order),
    email: resolveCustomerEmail(order),
    total: getOrderTotal(order),
    createdAt: toIsoDateString(order.createdAt),
  };
}

const STATUS_SAMPLE_SELECT =
  'orderId status totalPrice total createdAt customer name email shippingAddress user';

async function fetchRecentOrdersByStatus(
  statusFilter: Record<string, unknown>,
): Promise<StatsOrderSampleLean[]> {
  return Order.find(statusFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .select(STATUS_SAMPLE_SELECT)
    .populate('user', 'name email')
    .lean<StatsOrderSampleLean[]>();
}

export async function loadDashboardStats(): Promise<DashboardStatsPayload> {
  const CATEGORY_LABELS = await getCategoryNameMap();

  const [facetRows, totalUsers, lowStockRaw, pendingSamples, shippedSamples, deliveredSamples, cancelledSamples] =
    await Promise.all([
      Order.aggregate<FacetResult>([
        {
          $facet: {
            revenue: [
              { $match: analyticsMatch },
              { $addFields: ORDER_TOTAL_FIELD },
              { $group: { _id: null, total: { $sum: '$orderTotal' } } },
            ],
            productsSold: [
              { $match: analyticsMatch },
              { $addFields: LINE_ITEMS_FIELD },
              { $unwind: '$lineItems' },
              {
                $group: {
                  _id: null,
                  total: { $sum: { $ifNull: ['$lineItems.quantity', 0] } },
                },
              },
            ],
            productSales: [
              { $match: analyticsMatch },
              { $addFields: LINE_ITEMS_FIELD },
              { $unwind: '$lineItems' },
              {
                $addFields: {
                  productKey: {
                    $cond: {
                      if: { $ne: [{ $ifNull: ['$lineItems.product', null] }, null] },
                      then: { $toString: '$lineItems.product' },
                      else: { $ifNull: ['$lineItems.name', 'Unknown product'] },
                    },
                  },
                  lineRevenue: {
                    $multiply: [
                      { $ifNull: ['$lineItems.price', 0] },
                      { $ifNull: ['$lineItems.quantity', 0] },
                    ],
                  },
                  lineQty: { $ifNull: ['$lineItems.quantity', 0] },
                  lineName: { $ifNull: ['$lineItems.name', 'Unknown product'] },
                  lineProductId: '$lineItems.product',
                },
              },
              {
                $group: {
                  _id: '$productKey',
                  productObjectId: { $first: '$lineProductId' },
                  name: { $first: '$lineName' },
                  quantity: { $sum: '$lineQty' },
                  revenue: { $sum: '$lineRevenue' },
                },
              },
              { $sort: { revenue: -1 } },
            ],
            monthlySales: [
              { $match: { ...analyticsMatch, createdAt: { $exists: true, $ne: null } } },
              { $addFields: ORDER_TOTAL_FIELD },
              {
                $group: {
                  _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                  sales: { $sum: '$orderTotal' },
                },
              },
            ],
            statusCounts: [
              {
                $group: {
                  _id: null,
                  pending: {
                    $sum: {
                      $cond: [{ $in: ['$status', ['pending', 'processing']] }, 1, 0],
                    },
                  },
                  shipped: {
                    $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] },
                  },
                  delivered: {
                    $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
                  },
                  cancelled: {
                    $sum: {
                      $cond: [{ $in: ['$status', ['cancelled', 'canceled']] }, 1, 0],
                    },
                  },
                  confirmed: {
                    $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                  },
                  total: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      User.countDocuments({ role: 'user' }),
      Product.find({ quantity: { $lte: 10 } })
        .select('name quantity inStock category')
        .sort({ quantity: 1 })
        .limit(5)
        .lean<StatsProductLean[]>(),
      fetchRecentOrdersByStatus(buildAdminPendingStatusFilter()),
      fetchRecentOrdersByStatus({ status: 'shipped' }),
      fetchRecentOrdersByStatus({ status: 'delivered' }),
      fetchRecentOrdersByStatus({ status: { $in: ['cancelled', 'canceled'] } }),
    ]);

  const facet = facetRows[0] ?? {
    revenue: [],
    productsSold: [],
    productSales: [],
    monthlySales: [],
    statusCounts: [],
  };

  const totalRevenue = facet.revenue[0]?.total ?? 0;
  const productsSold = facet.productsSold[0]?.total ?? 0;
  const statusRow = facet.statusCounts[0];
  const totalOrders = statusRow?.total ?? 0;

  const orderStatusCounts: Record<DashboardStatusBucket, number> = {
    pending: statusRow?.pending ?? 0,
    shipped: statusRow?.shipped ?? 0,
    delivered: statusRow?.delivered ?? 0,
    cancelled: statusRow?.cancelled ?? 0,
  };

  const productIds = Array.from(
    new Set(
      facet.productSales
        .map((row) =>
          row.productObjectId ? row.productObjectId.toString() : undefined,
        )
        .filter(isNonEmptyString),
    ),
  );

  const rawProductDocs: StatsProductLean[] = productIds.length
    ? await Product.find({ _id: { $in: productIds } })
        .select('name category quantity inStock')
        .lean<StatsProductLean[]>()
    : [];

  const productMap = rawProductDocs.reduce<
    Record<string, { name: string; category?: string }>
  >((acc, product) => {
    const id = toLeanIdString(product._id);
    if (id) {
      acc[id] = {
        name: product.name || 'Unnamed product',
        category: product.category,
      };
    }
    return acc;
  }, {});

  const salesByProduct = facet.productSales.map((row) => {
    const productId = row.productObjectId?.toString() ?? row._id;
    const productDoc = row.productObjectId
      ? productMap[row.productObjectId.toString()]
      : undefined;
    const categoryId = productDoc?.category || 'uncategorized';
    const displayCategory = CATEGORY_LABELS[categoryId] || categoryId || 'Uncategorized';

    return {
      productId,
      name: productDoc?.name || row.name || 'Unknown product',
      category: displayCategory,
      quantity: row.quantity,
      revenue: row.revenue,
    };
  });

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
    (a, b) => b.revenue - a.revenue,
  );

  const topSellingProducts = salesByProduct.slice(0, 5);

  const lowStockProducts = lowStockRaw.map((product) => {
    const categoryKey = product.category ?? '';
    return {
      id: toLeanIdString(product._id),
      name: product.name || 'Unnamed product',
      quantity: product.quantity ?? 0,
      inStock: Boolean(product.inStock),
      category: CATEGORY_LABELS[categoryKey] || categoryKey || 'Uncategorized',
    };
  });

  const salesData = buildSalesData(facet.monthlySales);

  return {
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
    ordersByStatus: {
      pending: pendingSamples.map(mapSampleOrder),
      shipped: shippedSamples.map(mapSampleOrder),
      delivered: deliveredSamples.map(mapSampleOrder),
      cancelled: cancelledSamples.map(mapSampleOrder),
    },
  };
}
