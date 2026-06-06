import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { listRateLimiterKeys, clearRateLimiterKey } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || '200');
    const category = (url.searchParams.get('category') || undefined) as any;
    const cursor = url.searchParams.get('cursor') || '0';

    const data = await listRateLimiterKeys({ limit, category, cursor });

    return NextResponse.json(data);
  } catch (err) {
    console.error('admin rate limiter GET error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { key } = body;
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

    const ok = await clearRateLimiterKey(key);
    if (!ok) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

    return NextResponse.json({ message: 'Cleared' });
  } catch (err) {
    console.error('admin rate limiter DELETE error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // alias for delete to support some clients
  return DELETE(request);
}