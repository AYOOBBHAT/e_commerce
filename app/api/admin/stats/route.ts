import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { loadDashboardStats } from '@/lib/admin/dashboard-analytics';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    const stats = await loadDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
