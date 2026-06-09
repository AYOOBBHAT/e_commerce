import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { getInventoryMonitoringReport } from '@/lib/inventory/monitoring';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    const report = await getInventoryMonitoringReport();

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][inventory][monitoring] failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory monitoring report' },
      { status: 500 },
    );
  }
}
