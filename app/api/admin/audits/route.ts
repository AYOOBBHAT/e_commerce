import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Audit from '@/models/Audit';
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
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const orderId = searchParams.get('orderId');
    const adminEmail = searchParams.get('adminEmail');
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const filter: any = {};
    if (orderId) filter.orderId = orderId;
    if (action) filter.action = action;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) { const dt = new Date(dateTo); dt.setHours(23,59,59,999); filter.createdAt.$lte = dt; }
    }

    if (adminEmail) {
      // find admin users by email (anchored regex for performance)
      const regex = new RegExp('^' + adminEmail.replace(/[-\\/\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const admins = await User.find({ email: { $regex: regex } }).select('_id');
      const ids = admins.map(a => a._id);
      filter.adminId = ids.length ? { $in: ids } : { $in: [] };
    }

    const total = await Audit.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const audits = await Audit.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('adminId', 'name email')
      .populate('orderId', 'orderId');

    return NextResponse.json({ data: audits, total, page, limit, totalPages });
  } catch (error) {
    console.error('Error fetching audits:', error);
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 });
  }
}
