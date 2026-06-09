import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { getAdminInventoryAlerts } from '@/lib/alerts/inventory-alerts';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    const report = await getAdminInventoryAlerts();

    return NextResponse.json(
      {
        generatedAt: report.generatedAt,
        alerts: report.alerts,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[admin][alerts] failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin alerts' },
      { status: 500 },
    );
  }
}
