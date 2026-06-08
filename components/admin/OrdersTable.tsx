"use client";
import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
import { getOrderCustomerDisplay } from '@/lib/orders/admin-display';
import {
  formatPaymentStatusLabel,
} from '@/lib/orders/status-transitions';
import { formatOrderPaymentMethod } from '@/lib/order-success-content';

import { useEffect, useCallback } from 'react';

// local state will be fetched from API
// pagination state
const DEFAULT_LIMIT = 10;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
    case 'processing':
      return 'default';
    case 'confirmed':
      return 'secondary';
    case 'shipped':
      return 'secondary';
    case 'delivered':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
};

export default function OrdersTable() {
  const searchParams = useSearchParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  // filters - initialize from URL params
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams?.get('status') || undefined
  );
  const [emailFilter, setEmailFilter] = useState<string>(
    searchParams?.get('email') || ''
  );
  const [dateFrom, setDateFrom] = useState<string>(
    searchParams?.get('dateFrom') || ''
  );
  const [dateTo, setDateTo] = useState<string>(
    searchParams?.get('dateTo') || ''
  );
  const [searchFilter, setSearchFilter] = useState<string>(
    searchParams?.get('search') || searchParams?.get('q') || ''
  );

  // undo map: orderId -> previousStatus
  const [undoMap, setUndoMap] = useState<Record<string, string>>({});
  const undoTimers = useRef<Record<string, number>>({});

  const fetchOrders = useCallback(async (p = page, l = limit) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(l) });
      if (statusFilter) qs.set('status', statusFilter);
      if (emailFilter) qs.set('email', emailFilter);
      if (dateFrom) qs.set('dateFrom', dateFrom);
      if (dateTo) qs.set('dateTo', dateTo);
      if (searchFilter.trim()) qs.set('search', searchFilter.trim());
      const res = await fetch(`/api/admin/orders?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      setOrders(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      console.error('Failed to load admin orders', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, emailFilter, dateFrom, dateTo, searchFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to update order status');
      }

      // response returns { order, previousStatus }
      const result = await response.json();
      const prev = result?.previousStatus;
      // refresh current page
      await fetchOrders(page, limit);

      // if previous status present, allow undo for a short window
      if (prev) {
        setUndoMap((m) => ({ ...m, [orderId]: prev }));
        // clear any existing timer
        if (undoTimers.current[orderId]) {
          window.clearTimeout(undoTimers.current[orderId]);
        }
        const tid = window.setTimeout(() => {
          setUndoMap((m) => {
            const copy = { ...m };
            delete copy[orderId];
            return copy;
          });
          delete undoTimers.current[orderId];
        }, 8000);
        undoTimers.current[orderId] = tid as unknown as number;
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to update order status');
      await fetchOrders(page, limit);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndo = async (orderId: string) => {
    const prev = undoMap[orderId];
    if (!prev) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: prev }),
      });
      if (!res.ok) throw new Error('Undo failed');
      await fetchOrders(page, limit);
      // clear undo state
      setUndoMap((m) => { const c = { ...m }; delete c[orderId]; return c; });
      if (undoTimers.current[orderId]) { window.clearTimeout(undoTimers.current[orderId]); delete undoTimers.current[orderId]; }
    } catch (err) {
      console.error('Undo error', err);
      alert('Failed to undo status change');
    } finally { setIsUpdating(false); }
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
            <TableHead>Payment</TableHead>
            <TableHead>Pay status</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9}>Loading...</TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>No orders found.</TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const customer = getOrderCustomerDisplay(order);
              const paymentMethod = order.paymentInfo?.method || order.paymentMethod;
              const paymentStatus = order.paymentInfo?.status || order.paymentStatus;
              return (
              <TableRow key={order._id || order.id}>
                <TableCell className="font-medium">{order.orderId || order._id || order.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.email}
                    </div>
                    {customer.phone !== '—' && (
                      <div className="text-sm text-muted-foreground">
                        {customer.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : (order.date || '—')}</TableCell>
                <TableCell>{order.orderItems ? order.orderItems.length : (order.items ? order.items.length : '—')}</TableCell>
                <TableCell>₹{order.totalPrice || order.total || order.amount || 0}</TableCell>
                <TableCell>{formatOrderPaymentMethod(paymentMethod)}</TableCell>
                <TableCell>{formatPaymentStatusLabel(paymentStatus)}</TableCell>
                <TableCell>
                  <select
                    className="border rounded px-2 py-1"
                    value={order.status || 'processing'}
                    disabled={isUpdating}
                    onChange={async (e) => {
                      const val = e.target.value;
                      if (!confirm(`Change status to "${val}" for ${order.orderId || order._id || order.id}?`)) {
                        // revert select visually by refetching
                        await fetchOrders(page, limit);
                        return;
                      }
                      await handleUpdateStatus(order._id || order.id, val);
                    }}
                  >
                    {ORDER_STATUS.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
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
                          href={`/admin/orders/${order._id || order.id}`}
                          className="flex items-center"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      {order.status === 'processing' && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(order._id || order.id, 'confirmed')}
                          disabled={isUpdating}
                          className="flex items-center"
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Confirm Order
                        </DropdownMenuItem>
                      )}
                      {order.status !== 'cancelled' &&
                        order.status !== 'delivered' &&
                        order.status !== 'shipped' && (
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatus(order._id || order.id, 'cancelled')}
                          disabled={isUpdating}
                          className="flex items-center text-destructive focus:text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancel Order
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {undoMap[order._id || order.id] && (
                    <button
                      onClick={() => handleUndo(order._id || order.id)}
                      className="ml-2 text-sm px-2 py-1 border rounded bg-yellow-50"
                    >
                      Undo
                    </button>
                  )}
                </TableCell>
              </TableRow>
            );
            })
          )}
        </TableBody>
      </Table>
      {/* pagination controls: page size, page numbers, export */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Total: {total}</div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Status</label>
            <select value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || undefined)} className="border rounded px-2 py-1">
              <option value="">All</option>
              {ORDER_STATUS.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Search</label>
            <input
              className="border rounded px-2 py-1 min-w-[200px]"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Order ID, email, phone, name"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Email</label>
            <input className="border rounded px-2 py-1" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">From</label>
            <input type="date" className="border rounded px-2 py-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <label className="text-sm">To</label>
            <input type="date" className="border rounded px-2 py-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={() => { setPage(1); fetchOrders(1, limit); }}>Apply</Button>
          <Button onClick={() => { setStatusFilter(undefined); setEmailFilter(''); setSearchFilter(''); setDateFrom(''); setDateTo(''); setPage(1); fetchOrders(1, limit); }}>Clear</Button>
          <div>
            <Button onClick={async () => {
              try {
                const qs = new URLSearchParams();
                if (statusFilter) qs.set('status', statusFilter);
                if (emailFilter) qs.set('email', emailFilter);
                if (searchFilter.trim()) qs.set('search', searchFilter.trim());
                if (dateFrom) qs.set('dateFrom', dateFrom);
                if (dateTo) qs.set('dateTo', dateTo);
                const res = await fetch(`/api/admin/orders?export=csv&${qs.toString()}`);
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'orders-export.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                console.error('Export error', err);
                alert('Failed to export orders');
              }
            }}>Export CSV</Button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Button onClick={() => { if (page > 1) { setPage((p) => p - 1); fetchOrders(page - 1, limit); } }} disabled={page <= 1}>Prev</Button>
          <CompactPager page={page} totalPages={totalPages} onPage={(p) => { setPage(p); fetchOrders(p, limit); }} />
          <Button onClick={() => { if (page * limit < total) { setPage((p) => p + 1); fetchOrders(page + 1, limit); } }} disabled={page * limit >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
}

function CompactPager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void; }) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i);
      return result;
    }
    result.push(1);
    const left = Math.max(2, page - 2);
    const right = Math.min(totalPages - 1, page + 2);
    if (left > 2) result.push('...');
    for (let i = left; i <= right; i++) result.push(i);
    if (right < totalPages - 1) result.push('...');
    result.push(totalPages);
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex gap-1 items-center">
      {pages.map((p, idx) => (
        typeof p === 'number' ? (
          <button key={idx} onClick={() => onPage(p)} className={`px-2 py-1 rounded ${p === page ? 'bg-primary text-white' : 'bg-transparent'}`}>{p}</button>
        ) : (
          <span key={idx} className="px-2">…</span>
        )
      ))}
    </div>
  );
}