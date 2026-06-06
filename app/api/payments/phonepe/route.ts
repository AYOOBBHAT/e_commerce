import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/models/Order';
const { StandardCheckoutClient, StandardCheckoutPayRequest, Env } = require('pg-sdk-node');

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';

// Determine sandbox vs production based on client id or env
// If PHONEPE_ENV is explicitly set to 'PRODUCTION' or 'production', force production mode
// Otherwise, check if it's sandbox/uat or if client ID starts with 'SU'
const phoenpeEnv = process.env.PHONEPE_ENV?.toLowerCase();
const isSandbox = phoenpeEnv === 'production' || phoenpeEnv === 'prod'
  ? false  // Explicitly production
  : (PHONEPE_CLIENT_ID || '').startsWith('SU') || 
    phoenpeEnv === 'sandbox' ||
    phoenpeEnv === 'uat';

// Initialize PhonePe SDK client
function getPhonePeClient() {
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error('PhonePe credentials are missing. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.');
  }

  // Ensure clientVersion is a valid number or string
  const clientVersion = PHONEPE_CLIENT_VERSION ? String(PHONEPE_CLIENT_VERSION) : '1';
  
  // Validate Env object exists
  if (!Env) {
    throw new Error('PhonePe SDK Env object is not available. Please check SDK installation.');
  }
  
  // SDK uses SANDBOX (not UAT) for testing environment
  const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
  
  if (!env) {
    throw new Error(`PhonePe SDK Env.${isSandbox ? 'SANDBOX' : 'PRODUCTION'} is not available.`);
  }

  console.info('[payments][phonepe] initializing client with:', {
    clientId: PHONEPE_CLIENT_ID ? `${PHONEPE_CLIENT_ID.slice(0, 4)}***` : 'none',
    clientVersion,
    env: isSandbox ? 'SANDBOX' : 'PRODUCTION',
    envValue: env,
    phoenpeEnv: process.env.PHONEPE_ENV || 'not set',
  });

  try {
    // Use getInstance() as per official PhonePe SDK documentation
    // StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env)
    const client = StandardCheckoutClient.getInstance(
      String(PHONEPE_CLIENT_ID),
      String(PHONEPE_CLIENT_SECRET),
      clientVersion,
      env
    );
    
    console.info('[payments][phonepe] client initialized successfully using getInstance()');
    
    return client;
  } catch (clientError: any) {
    console.error('[payments][phonepe] client initialization error:', clientError);
    console.error('[payments][phonepe] error stack:', clientError?.stack);
    throw new Error(`Failed to initialize PhonePe client: ${clientError?.message || 'Unknown error'}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.info('[payments][phonepe] request body=', JSON.stringify(body));
    const { amount, orderId, redirectUrl } = body;
    
    // Masked logging: do not print secrets
    const maskedClientId = PHONEPE_CLIENT_ID ? `${PHONEPE_CLIENT_ID.slice(0, 4)}***${PHONEPE_CLIENT_ID.slice(-4)}` : 'none';
    console.info('[payments][phonepe] using clientId=', maskedClientId, 'sandbox=', isSandbox, 'clientVersion=', PHONEPE_CLIENT_VERSION || 'unset');
    
    const isDummy = !PHONEPE_CLIENT_ID || PHONEPE_CLIENT_ID === 'placeholder' || !PHONEPE_CLIENT_SECRET || PHONEPE_CLIENT_SECRET === 'placeholder';

    if (isDummy) {
      // Return fake response for test mode
      return NextResponse.json({
        merchantTransactionId: orderId,
        amount: amount * 100,
        status: 'created',
        testMode: true
      });
    }

    // Validate input with detailed checks
    if (!orderId) {
      console.warn('[payments][phonepe] missing orderId');
      return NextResponse.json({ error: 'Missing required field: orderId' }, { status: 400 });
    }
    if (!amount && amount !== 0) {
      console.warn('[payments][phonepe] missing amount');
      return NextResponse.json({ error: 'Missing required field: amount' }, { status: 400 });
    }
    // Note: redirectUrl is OPTIONAL according to PhonePe documentation for StandardCheckoutPayRequest
    // It's only required for CreateSdkOrderRequest (mobile SDK orders)

    // Validate and convert amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      console.warn('[payments][phonepe] invalid amount:', amount);
      return NextResponse.json({ error: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    }
    
    const amountPaise = Math.round(amountNum * 100);
    if (amountPaise < 100) {
      return NextResponse.json({ error: 'Minimum amount is 1 INR' }, { status: 400 });
    }

    // Ensure all values are properly formatted
    const merchantOrderId = String(orderId).trim();
    // redirectUrl is optional - only process if provided
    const redirectUrlStr = redirectUrl ? String(redirectUrl).trim() : undefined;

    if (!merchantOrderId) {
      return NextResponse.json({ error: 'Order ID cannot be empty' }, { status: 400 });
    }
    // Validate redirectUrl only if provided
    if (redirectUrlStr !== undefined && !redirectUrlStr) {
      return NextResponse.json({ error: 'Redirect URL cannot be empty if provided' }, { status: 400 });
    }

    // If redirectUrl is an HTTP localhost URL, PhonePe's hosted UI may reject it (requires HTTPS).
    // Strip it out to avoid a 400 from PhonePe. If the client really needs it in dev, set
    // NEXT_PUBLIC_ALLOW_HTTP_REDIRECT=true in the environment to override.
    if (redirectUrlStr && redirectUrlStr.startsWith('http://') && redirectUrlStr.includes('localhost') && process.env.NEXT_PUBLIC_ALLOW_HTTP_REDIRECT !== 'true') {
      console.warn('[payments][phonepe] stripping non-HTTPS localhost redirectUrl before calling PhonePe to avoid rejection');
    }

    console.info('[payments][phonepe] validated inputs:', {
      merchantOrderId,
      amountPaise,
      redirectUrl: redirectUrlStr ? redirectUrlStr.substring(0, 50) + '...' : 'not provided (optional)',
    });

    // Initialize PhonePe SDK client
    const client = getPhonePeClient();

    // Build payment request using SDK builder pattern with error handling
    // According to PhonePe documentation, redirectUrl is OPTIONAL for StandardCheckoutPayRequest
    let payRequest;
    try {
      const builder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountPaise); // amount in paise
      
      // Only add redirectUrl if provided (it's optional)
      if (redirectUrlStr) {
        builder.redirectUrl(redirectUrlStr);
      }
      
      payRequest = builder.build();
      
      console.info('[payments][phonepe] payment request built successfully', {
        hasRedirectUrl: !!redirectUrlStr,
      });
    } catch (buildError: any) {
      console.error('[payments][phonepe] error building payment request:', buildError);
      return NextResponse.json({ 
        error: `Failed to build payment request: ${buildError?.message || 'Unknown error'}` 
      }, { status: 500 });
    }

    // Mark the order in DB as pending and store the merchant transaction id for correlation
    try {
      await connectToDatabase();
      const updatedOrder = await Order.findByIdAndUpdate(String(merchantOrderId), {
        $set: {
          'paymentInfo.transactionId': String(merchantOrderId),
          'paymentInfo.method': 'phonepe',
          'paymentInfo.status': 'pending',
        }
      }, { new: true });
      if (!updatedOrder) {
        console.warn('[payments][phonepe] order not found to set paymentInfo for merchantOrderId=', merchantOrderId);
      } else {
        console.info('[payments][phonepe] updated order paymentInfo for _id=', merchantOrderId);
      }
    } catch (dbErr) {
      console.error('[payments][phonepe] could not update order paymentInfo', dbErr);
    }

    console.info('[payments][phonepe] initiating payment with SDK, merchantOrderId=', orderId, 'amount=', amountPaise);

    // Initiate payment using SDK
    const response = await client.pay(payRequest);

    console.info('[payments][phonepe] payment response received', {
      hasRedirectUrl: !!(response?.redirect_url || response?.redirectUrl || response?.data?.instrumentResponse?.redirectInfo?.url),
      state: response?.state,
      orderId: response?.order_id || response?.orderId,
      merchantOrderId: orderId,
    });

    // According to PhonePe documentation, response should have:
    // - redirect_url: String (URL for PhonePe Payment Gateway)
    // - state: String (expected value is PENDING)
    // - order_id: String (unique internal order ID)
    // - expire_at: String (Order expiry timestamp)
    // However, SDK may also return nested format, so handle both
    
    let paymentRedirectUrl: string | undefined;
    
    // Try direct formats (as per documentation)
    if (response?.redirect_url) {
      paymentRedirectUrl = response.redirect_url;
    } else if (response?.redirectUrl) {
      paymentRedirectUrl = response.redirectUrl;
    }
    // Fallback: Try nested format (if SDK returns different structure)
    else if (response?.data?.instrumentResponse?.redirectInfo?.url) {
      paymentRedirectUrl = response.data.instrumentResponse.redirectInfo.url;
    } else if (response?.data?.redirect_url) {
      paymentRedirectUrl = response.data.redirect_url;
    } else if (response?.data?.redirectUrl) {
      paymentRedirectUrl = response.data.redirectUrl;
    }

    if (!paymentRedirectUrl) {
      console.error('[payments][phonepe] invalid response from SDK - missing redirect URL', JSON.stringify(response));
      return NextResponse.json({ 
        error: 'Invalid response from PhonePe SDK. Missing redirect URL.',
        debug: { responseKeys: Object.keys(response || {}) }
      }, { status: 500 });
    }

    // Return response in expected format for frontend
    // Maintain compatibility with existing frontend code
    const out = {
      data: {
        instrumentResponse: {
          redirectInfo: {
            url: paymentRedirectUrl,
          },
        },
        orderId: response?.order_id || response?.orderId || response?.data?.orderId || orderId,
        state: response?.state || response?.data?.state,
        expireAt: response?.expire_at || response?.data?.expire_at,
        raw: response,
      },
    };

    return NextResponse.json(out);
  } catch (error: any) {
    console.error('[payments][phonepe] error:', error, error?.stack);
    
    // Provide more detailed error messages
    let errorMessage = 'PhonePe payment error';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data) {
      errorMessage = JSON.stringify(error.response.data);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 });
  }
}
