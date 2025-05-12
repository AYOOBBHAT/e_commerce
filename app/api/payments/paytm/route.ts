import { NextRequest, NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
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

    const { amount, orderId } = await request.json();

    const paytmParams = {
      MID: process.env.PAYTM_MERCHANT_ID!,
      WEBSITE: process.env.PAYTM_WEBSITE!,
      INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE!,
      CHANNEL_ID: process.env.PAYTM_CHANNEL_ID!,
      ORDER_ID: orderId,
      CUST_ID: session.userId,
      TXN_AMOUNT: amount.toString(),
      CALLBACK_URL: `${request.headers.get('origin')}/api/payments/paytm/callback`,
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams),
      process.env.PAYTM_MERCHANT_KEY!
    );

    return NextResponse.json({
      ...paytmParams,
      CHECKSUMHASH: checksum,
    });
  } catch (error) {
    console.error('Paytm error:', error);
    return NextResponse.json(
      { error: 'Payment initialization failed' },
      { status: 500 }
    );
  }
}