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
    const MID = process.env.PAYTM_MERCHANT_ID;
    const WEBSITE = process.env.PAYTM_WEBSITE;
    const INDUSTRY_TYPE_ID = process.env.PAYTM_INDUSTRY_TYPE;
    const CHANNEL_ID = process.env.PAYTM_CHANNEL_ID;
    const MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
    const isDummy = !MID || MID === 'placeholder' || !WEBSITE || WEBSITE === 'placeholder' || !INDUSTRY_TYPE_ID || INDUSTRY_TYPE_ID === 'placeholder' || !CHANNEL_ID || CHANNEL_ID === 'placeholder' || !MERCHANT_KEY || MERCHANT_KEY === 'placeholder';

    if (isDummy) {
      // Return fake response for test mode
      return NextResponse.json({
        ORDER_ID: orderId,
        TXN_AMOUNT: amount.toString(),
        status: 'created',
        testMode: true
      });
    }

    // ...existing code...
    const paytmParams = {
      MID,
      WEBSITE,
      INDUSTRY_TYPE_ID,
      CHANNEL_ID,
      ORDER_ID: orderId,
      CUST_ID: session.userId,
      TXN_AMOUNT: amount.toString(),
      CALLBACK_URL: `${request.headers.get('origin')}/api/payments/paytm/callback`,
    };

    const PaytmChecksum = (await import('paytmchecksum')).default;
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams),
      MERCHANT_KEY
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