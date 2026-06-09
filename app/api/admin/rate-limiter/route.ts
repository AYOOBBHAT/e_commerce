import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Audit from '@/models/Audit';
import { requireAdminFromDb } from '@/lib/admin/users-access';
import { listRateLimiterKeys, clearRateLimiterKey } from '@/lib/rateLimiter';
import { getRedisRateLimitHealth } from '@/lib/redis-health';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || '200');
    const category = (url.searchParams.get('category') || undefined) as
      | 'fail'
      | 'block'
      | 'comboFail'
      | 'comboBlock'
      | undefined;
    const cursor = url.searchParams.get('cursor') || '0';

    const [data, redis] = await Promise.all([
      listRateLimiterKeys({ limit, category, cursor }),
      getRedisRateLimitHealth(),
    ]);

    return NextResponse.json({ ...data, redis });
  } catch (err) {
    console.error('admin rate limiter GET error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminFromDb();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { key } = body;
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

    const ok = await clearRateLimiterKey(key);
    if (!ok) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

    try {
      await connectToDatabase();
      await Audit.create({
        adminId: auth.adminId,
        action: 'clear_rate_limit_key',
        before: key,
        after: 'cleared',
        reason: 'Admin cleared rate limiter key',
      });
    } catch (auditErr) {
      console.warn('[admin][rate-limiter] audit log failed', auditErr);
    }

    return NextResponse.json({ message: 'Cleared' });
  } catch (err) {
    console.error('admin rate limiter DELETE error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return DELETE(request);
}
