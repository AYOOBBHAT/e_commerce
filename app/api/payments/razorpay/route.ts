import { NextRequest, NextResponse } from 'next/server';

import { getServerSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { amount } = await request.json();
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isDummy = !keyId || keyId === 'placeholder' || !keySecret || keySecret === 'placeholder';

    if (isDummy) {
      // Return fake order for test mode
      return NextResponse.json({
        id: 'order_test',
        amount: amount * 100,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        status: 'created',
        testMode: true
      });
    }

    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Razorpay error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}