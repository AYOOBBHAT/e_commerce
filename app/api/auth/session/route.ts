import { getServerSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.userId) {
      return NextResponse.json({ user: null });
    }

    // Return only essential session data
    return NextResponse.json({
      user: {
        id: session.userId,
        role: session.role || 'user'
      }
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}