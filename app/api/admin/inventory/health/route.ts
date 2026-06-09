import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { getInventoryHealthReport } from '@/lib/inventory/health';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    const report = await getInventoryHealthReport();

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][inventory][health] failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory health' },
      { status: 500 },
    );
  }
}
