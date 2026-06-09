import crypto from 'crypto';
import type {
  PhonePeCallbackValidation,
  PhonePeCheckoutClient,
  PhonePeOrderStatusResponse,
} from '@/lib/payments/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StandardCheckoutClient, Env } = require('pg-sdk-node') as {
  StandardCheckoutClient: {
    getInstance: (
      clientId: string,
      clientSecret: string,
      clientVersion: string,
      env: unknown,
    ) => PhonePeCheckoutClient;
  };
  Env: { SANDBOX: unknown; PRODUCTION: unknown };
};

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID;
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET;
const PHONEPE_CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '1';

const phoenpeEnv = process.env.PHONEPE_ENV?.toLowerCase();
const isSandbox =
  phoenpeEnv === 'production' || phoenpeEnv === 'prod'
    ? false
    : (PHONEPE_CLIENT_ID || '').startsWith('SU') ||
      phoenpeEnv === 'sandbox' ||
      phoenpeEnv === 'uat';

export function isPhonePeSandbox(): boolean {
  return isSandbox;
}

export function getPhonePeClient(): PhonePeCheckoutClient {
  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error(
      'PhonePe credentials are missing. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET environment variables.',
    );
  }

  const clientVersion = PHONEPE_CLIENT_VERSION ? String(PHONEPE_CLIENT_VERSION) : '1';

  if (!Env) {
    throw new Error('PhonePe SDK Env object is not available. Please check SDK installation.');
  }

  const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
  if (!env) {
    throw new Error(`PhonePe SDK Env.${isSandbox ? 'SANDBOX' : 'PRODUCTION'} is not available.`);
  }

  return StandardCheckoutClient.getInstance(
    String(PHONEPE_CLIENT_ID),
    String(PHONEPE_CLIENT_SECRET),
    clientVersion,
    env,
  );
}

export async function fetchPhonePeOrderStatus(
  client: PhonePeCheckoutClient,
  merchantTransactionId: string,
): Promise<PhonePeOrderStatusResponse> {
  if (typeof client.getOrderStatus === 'function') {
    return client.getOrderStatus(merchantTransactionId);
  }
  if (typeof client.checkStatus === 'function') {
    return client.checkStatus(merchantTransactionId);
  }
  if (typeof client.status === 'function') {
    return client.status(merchantTransactionId);
  }
  throw new Error('Status check method not found in SDK. Expected getOrderStatus() method.');
}

const PHONEPE_WEBHOOK_USERNAME = process.env.PHONEPE_WEBHOOK_USERNAME;
const PHONEPE_WEBHOOK_PASSWORD = process.env.PHONEPE_WEBHOOK_PASSWORD;

export async function validatePhonePeWebhookSignature(
  client: PhonePeCheckoutClient,
  authHeader: string | null,
  responseBody: string,
): Promise<PhonePeCallbackValidation | false> {
  if (!PHONEPE_WEBHOOK_USERNAME || !PHONEPE_WEBHOOK_PASSWORD) {
    return true;
  }

  if (!authHeader) {
    console.warn('[payments][phonepe][callback] missing authorization header');
    return false;
  }

  try {
    if (typeof client.validateCallback === 'function') {
      const callbackResponse = client.validateCallback(
        PHONEPE_WEBHOOK_USERNAME,
        PHONEPE_WEBHOOK_PASSWORD,
        authHeader,
        responseBody,
      );

      if (callbackResponse && typeof callbackResponse === 'object') {
        const record = callbackResponse as PhonePeCallbackValidation & {
          isValid?: boolean;
          valid?: boolean;
        };
        const isValid = record.isValid ?? record.valid ?? true;
        if (!isValid) {
          console.warn('[payments][phonepe][callback] SDK validateCallback returned invalid response');
          return false;
        }
        return callbackResponse;
      }

      if (typeof callbackResponse === 'boolean') {
        return callbackResponse;
      }

      console.warn('[payments][phonepe][callback] SDK validateCallback returned unexpected format, using fallback');
    }

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
  } catch (error: unknown) {
    console.error('[payments][phonepe][callback] signature validation error', error);
    return false;
  }
}
