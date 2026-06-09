import { NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { getInventoryReconciliationReport } from '@/lib/inventory/reconciliation';

export async function GET() {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) {
      return auth.response;
    }

    const report = await getInventoryReconciliationReport();

    return NextResponse.json(report, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin][inventory][reconciliation] failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory reconciliation report' },
      { status: 500 },
    );
  }
}
