import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import {
  buildAdminOrderSearchFilter,
  mergeFilters,
} from '@/lib/orders/admin-search';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const statusFilter = searchParams.get('status');
    const emailFilter = searchParams.get('email');
    const searchFilter = searchParams.get('search') || searchParams.get('q');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exportCsv = searchParams.get('export') === 'csv';

    let filter: Record<string, unknown> = {};
    if (statusFilter) {
      if (statusFilter === 'pending') {
        filter.status = { $in: ['pending', 'processing'] };
      } else {
        filter.status = statusFilter;
      }
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) {
        const dt = new Date(dateTo);
        dt.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = dt;
      }
    }

    if (emailFilter) {
      const escaped = emailFilter.replace(/[-\\/\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('^' + escaped, 'i');
      const users = await User.find({ email: { $regex: regex } }).select('_id');
      const ids = users.map((u) => u._id);
      const emailOr = {
        $or: [
          { user: ids.length ? { $in: ids } : { $in: [] } },
          { 'customer.email': { $regex: regex } },
        ],
      };
      filter = mergeFilters(filter, emailOr);
    }

    if (searchFilter?.trim()) {
      const searchQuery = await buildAdminOrderSearchFilter(searchFilter);
      filter = mergeFilters(filter, searchQuery);
    }

    // If CSV export requested, return the CSV for all matching orders
    if (exportCsv) {
      // Stream CSV to avoid building it fully in memory for large datasets
      const cursor = Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).cursor();
      const header = ['OrderID', 'CustomerName', 'CustomerEmail', 'Date', 'Status', 'PaymentMethod', 'PaymentStatus', 'Total', 'ItemsCount'];
      const encoder = new TextEncoder();

      let headerSent = false;
      const stream = new ReadableStream({
        async pull(controller) {
          try {
            // first time, enqueue header
            if (!headerSent) {
              controller.enqueue(encoder.encode(header.join(',') + '\n'));
              headerSent = true;
            }
            const doc = await cursor.next();
            if (!doc) {
              controller.close();
              return;
            }
            const o: any = doc;
            const itemsCount = (o.orderItems && o.orderItems.length) || 0;
            const customerName = o.user?.name || o.customer?.name || '';
            const customerEmail = o.user?.email || o.customer?.email || '';
            const row = [
              o.orderId || o._id || '',
              customerName,
              customerEmail,
              o.createdAt ? new Date(o.createdAt).toISOString() : '',
              o.status || '',
              o.paymentInfo?.method || '',
              o.paymentInfo?.status || '',
              (o.totalPrice || o.total || 0).toString(),
              itemsCount.toString(),
            ].map(field => `"${String(field).replace(/"/g,'""')}"`).join(',') + '\n';
            controller.enqueue(encoder.encode(row));
          } catch (err) {
            controller.error(err);
          }
        },
        cancel() {
          try { cursor.close(); } catch (e) {}
        }
      });

      // Generate filename with filters if applicable
      const filenameParts = ['orders-export'];
      if (statusFilter) {
        // For pending, include both pending and processing in filename
        if (statusFilter === 'pending') {
          filenameParts.push('pending-processing');
        } else {
          filenameParts.push(statusFilter);
        }
      }
      if (dateFrom || dateTo) {
        const fromStr = dateFrom ? dateFrom.replace(/-/g, '') : 'all';
        const toStr = dateTo ? dateTo.replace(/-/g, '') : 'today';
        filenameParts.push(`${fromStr}-to-${toStr}`);
      }
      const filename = `${filenameParts.join('-')}.csv`;

      const res = new NextResponse(stream as any, { status: 200 });
      res.headers.set('Content-Type', 'text/csv');
      res.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      return res;
    }

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({ data: orders, total, page, limit, totalPages });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}