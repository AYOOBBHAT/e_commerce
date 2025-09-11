import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;

const BASE_URL = 'https://api.phonepe.com/apis/hermes';

export async function POST(req: Request) {
  try {
    const { amount, orderId, redirectUrl } = await req.json();
    if (!amount || !orderId || !redirectUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare payload
    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      amount: amount * 100, // PhonePe expects amount in paise
      redirectUrl,
      callbackUrl: redirectUrl,
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = payloadBase64 + '/pg/v1/pay' + PHONEPE_SALT_KEY;
    const xVerify = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + PHONEPE_SALT_INDEX;

    // Initiate payment
    const response = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': PHONEPE_MERCHANT_ID || '',
      },
      body: JSON.stringify({ request: payloadBase64 }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error && error.message ? error.message : 'PhonePe payment error' }, { status: 500 });
  }
}
