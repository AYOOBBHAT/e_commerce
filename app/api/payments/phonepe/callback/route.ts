import { NextRequest, NextResponse } from 'next/server';
import Order from '@/models/Order';
import { connectToDatabase } from '@/lib/db';
import { finalizeOrder as finalizePaymentOrder } from '@/lib/finalizePayment';
import crypto from 'crypto';
const { StandardCheckoutClient, Env } = require('pg-sdk-node');

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';
const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME;
const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD;

// Determine sandbox vs production based on client id or env
// If PHONEPE_ENV is explicitly set to 'PRODUCTION' or 'production', force production mode
// Otherwise, check if it's sandbox/uat or if client ID starts with 'SU'
const phoenpeEnv = process.env.PHONEPE_ENV?.toLowerCase();
const isSandbox = phoenpeEnv === 'production' || phoenpeEnv === 'prod'
  ? false  // Explicitly production
  : (PHONEPE_CLIENT_ID || '').startsWith('SU') || 
    phoenpeEnv === 'sandbox' ||
    phoenpeEnv === 'uat';

/**
 * PhonePe PG Webhook Handler
 * 
 * Security: Two-layer verification
 * 1. Optional: Validate webhook signature using SHA256 hash of username:password (if configured)
 * 2. Always: Call PhonePe Status API to verify payment (primary security check)
 * 3. Update order only after status is confirmed
 * 
 * Webhook format:
 * {
 *   "event": "pg.order.completed" | "pg.order.failed",
 *   "data": {
 *     "merchantTransactionId": "T123",
 *     "transactionId": "PPE123"
 *   }
 * }
 */

// Validate webhook signature using SDK's validateCallback() method
// According to PhonePe documentation: client.validateCallback(username, password, authorizationHeader, responseBodyString)
async function validateWebhookSignature(
  client: any,
  authHeader: string | null,
  responseBody: string
): Promise<any> {
  if (!PHONEPE_WEBHOOK_USERNAME || !PHONEPE_WEBHOOK_PASSWORD) {
    // If webhook credentials not configured, skip signature validation
    // We'll still verify via Status API
    return true;
  }

  if (!authHeader) {
    console.warn('[payments][phonepe][callback] missing authorization header');
    return false;
  }

  try {
    // Use SDK's validateCallback method as per official documentation
    if (typeof client.validateCallback === 'function') {
      const callbackResponse = client.validateCallback(
        PHONEPE_WEBHOOK_USERNAME,
        PHONEPE_WEBHOOK_PASSWORD,
        authHeader,
        responseBody
      );
      
      // If SDK returns a callback object, return it (it contains payload & type)
      if (callbackResponse && typeof callbackResponse === 'object') {
        // If the SDK returns an object that includes validity info, ensure it's valid
        const isValid = callbackResponse?.isValid ?? callbackResponse?.valid ?? true;
        if (!isValid) {
          console.warn('[payments][phonepe][callback] SDK validateCallback returned invalid response');
          return false;
        }
        return callbackResponse;
      }

      // If boolean returned, just return it
      if (typeof callbackResponse === 'boolean') {
        return callbackResponse;
      }

      // Fallback: unexpected format
      console.warn('[payments][phonepe][callback] SDK validateCallback returned unexpected format, using fallback');
    }
    
    // Fallback: Manual validation using SHA256 hash
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${PHONEPE_WEBHOOK_USERNAME}:${PHONEPE_WEBHOOK_PASSWORD}`)
      .digest('hex');

    const receivedHash = authHeader.replace(/^Bearer\s+/i, '').trim();
    const isValid = receivedHash === expectedHash;
    
    if (!isValid) {
      console.warn('[payments][phonepe][callback] webhook signature validation failed');
    }
    return isValid;
  } catch (error) {
    console.error('[payments][phonepe][callback] signature validation error', error);
    return false;
  }
}

// Initialize PhonePe SDK client using getInstance() as per official documentation
function getPhonePeClient() {
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error('PhonePe credentials are missing. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.');
  }

  // Ensure clientVersion is a valid string
  const clientVersion = PHONEPE_CLIENT_VERSION ? String(PHONEPE_CLIENT_VERSION) : '1';
  
  // SDK uses SANDBOX (not UAT) for testing environment
  const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
  
  // Use getInstance() as per official PhonePe SDK documentation
  // StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env)
  return StandardCheckoutClient.getInstance(
    String(PHONEPE_CLIENT_ID),
    String(PHONEPE_CLIENT_SECRET),
    clientVersion,
    env
  );
}

// Verify payment status using SDK
// According to PhonePe documentation: client.getOrderStatus(merchantOrderId)
async function verifyPaymentWithStatusAPI(client: any, merchantTransactionId: string) {
  try {
    // Use getOrderStatus as per official PhonePe SDK documentation
    if (typeof client.getOrderStatus === 'function') {
      return await client.getOrderStatus(merchantTransactionId);
    }
    // Fallback: Try checkStatus method if getOrderStatus doesn't exist
    if (typeof client.checkStatus === 'function') {
      return await client.checkStatus(merchantTransactionId);
    }
    // Fallback: Try status method
    if (typeof client.status === 'function') {
      return await client.status(merchantTransactionId);
    }
    throw new Error('Status check method not found in SDK. Expected getOrderStatus() method.');
  } catch (error: any) {
    console.error('[payments][phonepe][callback] status check failed', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get request body as text first for signature validation
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    
    // Initialize client for validation
    const client = getPhonePeClient();
    
    // Validate webhook signature using SDK's validateCallback() method
    const authHeader = request.headers.get('authorization');
    const callbackValidation = await validateWebhookSignature(client, authHeader, bodyText);
    
    if (!callbackValidation) {
      console.error('[payments][phonepe][callback] invalid webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If SDK returned a callback object, prefer using payload to extract merchant order id
    if (typeof callbackValidation === 'object' && callbackValidation.payload) {
      // Normalize payload into body if not already
      try {
        body.data = body.data || callbackValidation.payload || body;
      } catch (e) {
        // ignore
      }
    }

    console.info('[payments][phonepe][callback] webhook received event=', body.event || callbackValidation?.type, 'data=', JSON.stringify(body.data || callbackValidation?.payload));

    // Extract event type and transaction ID from webhook
    const event = body.event || '';
    const merchantTransactionId = body.data?.merchantTransactionId || body.data?.merchantOrderId || body.data?.originalMerchantOrderId || body.data?.orderId || body.data?.originalMerchantOrderId;
    const transactionId = body.data?.transactionId || body.data?.paymentDetails?.[0]?.transactionId || body.data?.payment_details?.[0]?.transactionId;

    if (!merchantTransactionId) {
      console.warn('[payments][phonepe][callback] no merchantTransactionId in webhook');
      return NextResponse.json({ success: true }); // Return 200 to prevent retries
    }

    // Verify payment status with PhonePe using SDK (client already initialized above)
    const statusResponse = await verifyPaymentWithStatusAPI(client, merchantTransactionId);
    
    console.info('[payments][phonepe][callback] status API response', {
      code: statusResponse?.code,
      success: statusResponse?.success,
      data: JSON.stringify(statusResponse?.data || statusResponse),
    });

    await connectToDatabase();

    // Only update order if status API confirms payment success/failure
    // SDK returns status in different formats, handle both
    const rawState = statusResponse?.state || statusResponse?.data?.state || statusResponse?.data?.status || statusResponse?.code || statusResponse?.data?.code || '';
    const state = String(rawState || '').toUpperCase();
    const orderId = merchantTransactionId;

    // Resolve transaction id if present in various response shapes
    const resolvedTransactionId = transactionId || statusResponse?.data?.payment_details?.[0]?.transactionId || statusResponse?.data?.paymentDetails?.[0]?.transactionId || statusResponse?.data?.transactionId;

    // Using shared finalizer implemented in lib/finalizePayment.ts
    // This file previously included a local finalize helper; the shared helper keeps logic consistent across providers.

    // Finalize or update order based on the resolved state
    if (orderId) {
      try {
        await finalizePaymentOrder({ provider: 'phonepe', merchantOrderId: String(orderId), txId: String(resolvedTransactionId || ''), state, providerResponse: statusResponse });
      } catch (err) {
        console.error('[payments][phonepe][callback] finalizePaymentOrder error', err);
      }
    }



    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[payments][phonepe][callback] error=', error.message);
    // Always return 200 to prevent PhonePe from retrying
    // Log the error but don't fail the webhook
    return NextResponse.json({ success: true });
  }
}
