import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Eye, PackageCheck, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUS } from '@/lib/constants';

// Mock data - replace with real data from your API
const orders = [
  {
    id: 'ORD001',
    customer: 'John Doe',
    email: 'john@example.com',
    date: '2024-03-20',
    total: 299.99,
    status: 'processing',
    items: 3,
  },
  {
    id: 'ORD002',
    customer: 'Jane Smith',
    email: 'jane@example.com',
    date: '2024-03-19',
    total: 149.99,
    status: 'confirmed',
    items: 2,
  },
  {
    id: 'ORD003',
    customer: 'Mike Johnson',
    email: 'mike@example.com',
    date: '2024-03-18',
    total: 499.99,
    status: 'shipped',
    items: 4,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'processing':
      return 'default';
    case 'confirmed':
      return 'primary';
    case 'shipped':
      return 'secondary';
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

export default function OrdersTable() {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to update this order's status?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh the orders list
      window.location.reload();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.customer}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{order.date}</TableCell>
              <TableCell>{order.items}</TableCell>
              <TableCell>${order.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {order.status === 'processing' && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                        disabled={isUpdating}
                        className="flex items-center"
                      >
                        <PackageCheck className="mr-2 h-4 w-4" />
                        Confirm Order
                      </DropdownMenuItem>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <DropdownMenuItem
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={isUpdating}
                        className="flex items-center text-destructive focus:text-destructive"
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}