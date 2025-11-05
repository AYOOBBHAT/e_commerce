import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const statusFilter = searchParams.get('status');
    const emailFilter = searchParams.get('email');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const exportCsv = searchParams.get('export') === 'csv';

    const filter: any = {};
    if (statusFilter) filter.status = statusFilter;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        // include the whole day for dateTo
        const dt = new Date(dateTo);
        dt.setHours(23,59,59,999);
        filter.createdAt.$lte = dt;
      }
    }

    if (emailFilter) {
      // find users matching email (use anchored regex for prefix match which can use index)
      const escaped = emailFilter.replace(/[-\\/\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('^' + escaped, 'i');
      const users = await User.find({ email: { $regex: regex } }).select('_id');
      const ids = users.map(u => u._id);
      // if no users match, ensure no orders returned
      filter.user = ids.length ? { $in: ids } : { $in: [] };
    }

    // If CSV export requested, return the CSV for all matching orders
    if (exportCsv) {
      // Stream CSV to avoid building it fully in memory for large datasets
      const cursor = Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).cursor();
      const header = ['OrderID', 'UserName', 'UserEmail', 'Date', 'Status', 'Total', 'ItemsCount'];
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
            const itemsCount = (o.items && o.items.length) || (o.orderItems && o.orderItems.length) || 0;
            const row = [
              o.orderId || o._id || '',
              o.user?.name || '',
              o.user?.email || '',
              o.createdAt ? new Date(o.createdAt).toISOString() : '',
              o.status || '',
              (o.total || o.totalPrice || o.amount || 0).toString(),
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

      const res = new NextResponse(stream as any, { status: 200 });
      res.headers.set('Content-Type', 'text/csv');
      res.headers.set('Content-Disposition', 'attachment; filename="orders-export.csv"');
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