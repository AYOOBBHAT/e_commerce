import { NextRequest, NextResponse } from 'next/server';
import PaytmChecksum from 'paytmchecksum';
import Order from '@/models/Order';
import { connectToDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const paytmChecksum = data.CHECKSUMHASH;
    delete data.CHECKSUMHASH;

    const isVerified = await PaytmChecksum.verifySignature(
      JSON.stringify(data),
      process.env.PAYTM_MERCHANT_KEY!,
      paytmChecksum
    );

    if (isVerified) {
      await connectToDatabase();
      
      if (data.STATUS === 'TXN_SUCCESS') {
        await Order.findOneAndUpdate(
          { _id: data.ORDERID },
          {
            $set: {
              'paymentInfo.status': 'completed',
              'paymentInfo.transactionId': data.TXNID,
            },
          }
        );
      }

      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: 'Checksum mismatch' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Paytm callback error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}