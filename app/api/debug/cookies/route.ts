import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || null;
    // parse token cookie if present
    const tokenMatch = cookieHeader?.split(';').map(s => s.trim()).find(s => s.startsWith('token=')) || null;
    const tokenValue = tokenMatch ? tokenMatch.split('=')[1] : null;

    console.log('DEBUG /api/debug/cookies - Cookie header:', cookieHeader);

    return NextResponse.json({
      cookieHeader,
      hasToken: !!tokenValue,
      tokenSnippet: tokenValue ? `${tokenValue.slice(0, 8)}...` : null,
    });
  } catch (error) {
    console.error('Debug cookies error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
