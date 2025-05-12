import { Package } from 'lucide-react';
import OrdersTable from '@/components/admin/OrdersTable';

export default function AdminOrders() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      <OrdersTable />
    </div>
  );
}