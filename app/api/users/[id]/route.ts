import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import { getServerSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const user = await User.findById(params.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.userId !== params.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const data = await req.json();

    const update: any = {};
    if (typeof data.name === 'string') update.name = data.name;
    if (typeof data.email === 'string') update.email = data.email;
    if (typeof data.phone === 'string') update.phone = data.phone;
    if (data.addresses) update.addresses = data.addresses;

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(data.password, salt);
    }

    const user = await User.findByIdAndUpdate(params.id, { $set: update }, { new: true }).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.userId !== params.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndDelete(params.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Clear auth cookie by mirroring logout behavior
    const isProd = process.env.NODE_ENV === 'production';
    const COOKIE_SAME_SITE = (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'lax';
    const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

    const response = NextResponse.json({ message: 'Account deleted' }, { headers: { 'Cache-Control': 'no-store' } });
    const cookieOpts: Record<string, any> = {
      name: 'token',
      value: '',
      httpOnly: true,
      secure: isProd,
      expires: new Date(0),
      path: '/',
      sameSite: COOKIE_SAME_SITE as any,
    };
    if (COOKIE_DOMAIN) cookieOpts.domain = COOKIE_DOMAIN;
    response.cookies.set(cookieOpts as any);
    return response;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
