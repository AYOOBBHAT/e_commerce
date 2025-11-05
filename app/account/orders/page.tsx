"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  processing: 'default',
  confirmed: 'secondary',
  shipped: 'secondary',
  delivered: 'outline',
  cancelled: 'destructive',
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        // Normalize common field names so UI is resilient to schema differences
        const normalized = data.map((o: any) => ({
          _id: o._id || o.id || o.orderId,
          orderId: o.orderId || o._id || o.id,
          createdAt: o.createdAt || o.created_at || o.date,
          status: o.status || o.orderStatus || o.paymentStatus || 'processing',
          total: o.total || o.totalPrice || o.amount || 0,
          itemsCount: (o.items && o.items.length) || (o.orderItems && o.orderItems.length) || (o.itemsCount) || 0,
        }));
        setOrders(normalized);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-muted-foreground">No orders found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order._id}>
                <TableCell>
                  <a href={`/orders/${order._id}`} className="text-primary underline">
                    {order.orderId || order._id}
                  </a>
                </TableCell>
                <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status] || 'default'} className="capitalize">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>{order.itemsCount}</TableCell>
                <TableCell>₹{order.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
