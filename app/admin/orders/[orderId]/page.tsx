"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from "next/image";

interface OrderItem {
  _id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  user?: {
    name?: string;
    email?: string;
  };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items: OrderItem[];
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  processing: 'default',
  confirmed: 'secondary',
  shipped: 'secondary',
  delivered: 'outline',
  cancelled: 'destructive',
};

export default function AdminOrderDetails() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>
      <div className="mb-4">
        <strong>Order ID:</strong> {order._id}<br />
        <strong>User:</strong> {order.user?.name || order.user?.email}<br />
        <strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}<br />
        <strong>Status:</strong> <Badge variant={STATUS_VARIANT[order.status] || 'default'}>{order.status}</Badge><br />
        <strong>Total:</strong> ₹{order.total}<br />
        <strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})<br />
        <strong>Shipping Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
      </div>
      <h2 className="text-lg font-semibold mb-2">Items</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((item) => (
            <TableRow key={item._id}>
              <TableCell>{item.name}</TableCell>
              <TableCell><Image src={item.image} alt={item.name} width={48} height={48} /></TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>₹{item.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
