import { NextResponse } from 'next/server';
import User from '@/models/User';
import { requireAdminFromDb } from '@/lib/admin/users-access';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
