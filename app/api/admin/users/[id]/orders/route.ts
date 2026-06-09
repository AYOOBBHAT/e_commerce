import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import { requireAdminFromDb } from '@/lib/admin/users-access';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const orders = await Order.find({ user: params.id }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user orders' },
      { status: 500 }
    );
  }
}
