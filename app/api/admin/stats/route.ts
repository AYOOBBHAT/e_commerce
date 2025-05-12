import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get total revenue
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

    // Get total orders count
    const totalOrders = orders.length;

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get total products sold
    const productsSold = orders.reduce(
      (acc, order) => acc + order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      0
    );

    // Get sales data for chart
    const salesData = await Order.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          sales: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 6 }
    ]);

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalUsers,
      productsSold,
      salesData: salesData.map(item => ({
        name: item._id,
        sales: item.sales
      }))
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}