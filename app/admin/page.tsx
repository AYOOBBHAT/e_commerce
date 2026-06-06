'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  Ban,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SalesPoint = { name: string; sales: number };
type SalesByProductEntry = {
  productId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
};
type SalesByCategoryEntry = { category: string; revenue: number; quantity: number };
type InventoryEntry = { id: string; name: string; quantity: number; inStock: boolean; category: string };
type OrderSummary = { orderId: string; customer: string; email: string; total: number; createdAt: string };

interface StatsResponse {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  productsSold: number;
  salesData: SalesPoint[];
  salesByProduct: SalesByProductEntry[];
  salesByCategory: SalesByCategoryEntry[];
  topSellingProducts: SalesByProductEntry[];
  lowStockProducts: InventoryEntry[];
  orderStatusCounts: { pending: number; shipped: number; delivered: number; cancelled: number };
  ordersByStatus: {
    pending: OrderSummary[];
    shipped: OrderSummary[];
    delivered: OrderSummary[];
    cancelled: OrderSummary[];
  };
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat('en-IN');

const formatCurrency = (value?: number) => currencyFormatter.format(value || 0);
const formatNumber = (value?: number) => numberFormatter.format(value || 0);
const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const ORDER_TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', icon: Ban },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading && !stats) {
    return <div className="text-muted-foreground">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Monitor store activity, inventory, and fulfillment.</p>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-3">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { title: 'Number of Orders', value: formatNumber(stats.totalOrders), icon: ShoppingBag, color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { title: 'Products Sold', value: formatNumber(stats.productsSold), icon: Package, color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { title: 'Customers', value: formatNumber(stats.totalUsers), icon: Users, color: 'bg-orange-50 border-orange-200 text-orange-700' },
            ].map((card) => (
              <Card key={card.title} className="border-2 bg-white hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white">
                  <CardTitle className="text-sm font-medium text-gray-900">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="bg-white">
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Sales Overview</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              {stats.salesData.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not enough data to render the sales chart yet.</p>
              ) : (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-2 bg-white">
              <CardHeader className="bg-white">
                <CardTitle className="text-gray-900">Sales by Product</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                {stats.salesByProduct.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No product-level sales yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.salesByProduct.map((product) => (
                        <TableRow key={product.productId}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{product.category}</TableCell>
                          <TableCell className="text-right">{formatNumber(product.quantity)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 bg-white">
              <CardHeader className="bg-white">
                <CardTitle className="text-gray-900">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                {stats.salesByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No category-level sales yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.salesByCategory.map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell className="text-right">{formatNumber(category.quantity)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 bg-white">
            <CardHeader className="bg-white">
              <CardTitle className="text-gray-900">Product & Inventory Insights</CardTitle>
            </CardHeader>
            <CardContent className="bg-white">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Top-selling products</h4>
                  {stats.topSellingProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sales data will appear here once orders arrive.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.topSellingProducts.map((product) => (
                        <div key={product.productId} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(product.quantity)} units
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Low-stock products</h4>
                  {stats.lowStockProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No products need restocking right now.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.lowStockProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          <Badge variant="outline" className="border-amber-200 text-amber-700">
                            {product.quantity} in stock
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 bg-white">
            <CardHeader className="bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Orders by status</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="outline" size="sm" className="bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 hover:text-gray-900">
                    View All Orders
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div className="grid gap-3 sm:grid-cols-4">
                {ORDER_TABS.map((tab) => {
                  // Map dashboard status buckets to actual order statuses
                  // 'pending' bucket includes both 'pending' and 'processing' orders
                  const statusMap: Record<string, string> = {
                    pending: 'pending', // Will show both pending and processing
                    shipped: 'shipped',
                    delivered: 'delivered',
                    cancelled: 'cancelled',
                  };
                  const statusValue = statusMap[tab.id] || tab.id;
                  return (
                    <Link
                      key={tab.id}
                      href={`/admin/orders?status=${statusValue}`}
                      className="rounded-lg border-2 bg-white p-4 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900">
                        {formatNumber(stats.orderStatusCounts[tab.id])}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                      </p>
                    </Link>
                  );
                })}
              </div>

              <Tabs defaultValue="pending">
                <TabsList className="grid grid-cols-4">
                  {ORDER_TABS.map((tab) => {
                    const statusMap: Record<string, string> = {
                      pending: 'pending',
                      shipped: 'shipped',
                      delivered: 'delivered',
                      cancelled: 'cancelled',
                    };
                    const statusValue = statusMap[tab.id] || tab.id;
                    return (
                      <TabsTrigger key={tab.id} value={tab.id} asChild>
                        <Link href={`/admin/orders?status=${statusValue}`} className="cursor-pointer">
                          {tab.label}
                        </Link>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {ORDER_TABS.map((tab) => {
                  const statusMap: Record<string, string> = {
                    pending: 'pending',
                    shipped: 'shipped',
                    delivered: 'delivered',
                    cancelled: 'cancelled',
                  };
                  const statusValue = statusMap[tab.id] || tab.id;
                  return (
                    <TabsContent key={tab.id} value={tab.id}>
                      {stats.ordersByStatus[tab.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No {tab.label.toLowerCase()} orders at the moment.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {stats.ordersByStatus[tab.id].map((order) => (
                            <Link
                              key={order.orderId}
                              href={`/admin/orders/${order.orderId}`}
                              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold">{order.orderId}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.customer} · {order.email}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{formatCurrency(order.total)}</p>
                                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                              </div>
                            </Link>
                          ))}
                          <div className="pt-2">
                            <Link href={`/admin/orders?status=${statusValue}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                View All {tab.label} Orders
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}