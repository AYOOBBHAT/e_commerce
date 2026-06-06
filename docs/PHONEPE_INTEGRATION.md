PhonePe Integration (Standard Checkout)

Overview
- This repo integrates PhonePe using the official Node.js SDK (`pg-sdk-node`).
- Supported flow: Server initiates payment (Standard Checkout `client.pay`), frontend redirects user to PhonePe Gateway, and PhonePe sends webhook/callback to confirm final status.

Environment variables required
- PHONEPE_CLIENT_ID
- PHONEPE_CLIENT_SECRET
- PHONEPE_CLIENT_VERSION (optional, default `1`)
- PHONEPE_ENV (optional: `PRODUCTION` or `SANDBOX`)
- PHONEPE_WEBHOOK_USERNAME (optional, used for callback validation)
- PHONEPE_WEBHOOK_PASSWORD (optional, used for callback validation)

Key implementation points
- Initiate Payment (`/api/payments/phonepe`):
  - Expects `{ amount, orderId, redirectUrl? }` where `orderId` is the internal DB _id of the order (ObjectId string).
  - Creates a PhonePe `StandardCheckoutPayRequest` and calls `client.pay(request)`.
  - Before calling the SDK the endpoint updates the Order record to set `paymentInfo.transactionId` to the `orderId` and `paymentInfo.status = 'pending'` so the webhook can find the order.
  - Returns `{ data: { instrumentResponse: { redirectInfo: { url } }, orderId, state } }`.

- Webhook/callback (`/api/payments/phonepe/callback`):
  - Verifies webhook authenticity using `client.validateCallback(username,password,authorizationHeader,bodyString)` (SDK helper).
  - Always confirms the payment status by calling `client.getOrderStatus(merchantOrderId)` and maps PhonePe state values (`COMPLETED`, `FAILED`, `PENDING`) to local `paymentInfo.status`.
  - Updates the order by _id or by `paymentInfo.transactionId`.

Frontend changes
- Checkout now creates a backend Order first (POST `/api/orders`) with `paymentMethod: 'phonepe'` and uses the returned `id` (DB _id) as the `orderId` when calling `/api/payments/phonepe`.
- Redirect url passed to PhonePe includes the DB id as `orderId` query so `order-success` can fetch the order by _id.

Manual testing checklist
1. Set environment variables for PhonePe (use sandbox/test credentials). Important env vars: `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_ENV`, `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD`.
2. In checkout, click PhonePe → verify a new Order is created (check `/api/orders` or DB) and has `paymentInfo.transactionId` set to the order _id and `paymentInfo.status = 'pending'`.
3. The response from `/api/payments/phonepe` should include `data.instrumentResponse.redirectInfo.url` - open it to view PhonePe PG (sandbox UI).
4. Emulate a PhonePe webhook (or use real UAT/webhook flow): the callback handler must validate the signature and then call `getOrderStatus` to confirm. You can use the provided script to simulate a webhook locally (see below).
5. On receiving webhook, order's `paymentInfo.status` should change to `completed` or `failed` and transactionId should be set if available.

-- Integration script --
The project previously included a Jest-based automated test suite, but that has been removed at your request.

A lightweight manual script remains: `scripts/test-phonepe-webhook.js` — it can create a minimal order and post a simulated webhook to your running server (useful for local/dev testing). It is NOT intended for production use.

Usage (dev/local):
- Start your dev server (e.g., `npm run dev`).
- Run: `npm run test:phonepe-webhook`

Environment (optional):
- If your dev server is running on a different host or port, set `TEST_BASE_URL` to the base URL, e.g. `TEST_BASE_URL=http://127.0.0.1:3000 npm run test:phonepe-webhook`.
- The script uses `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` to compute an authorization header (it uses fallback SHA256(username:password)). Ensure these env vars are set to the same values your server expects.

If you want the Jest tests and CI integration restored later, tell me and I’ll add them back in a branch or behind a feature flag.

-- Production test endpoint --
A guarded production test endpoint has been added at `POST /api/payments/phonepe/prod-test`.

Requirements (must be set in environment):
- `ALLOW_PROD_TEST=true` (must be explicitly enabled)
- `PROD_TEST_KEY` (a secret key required in request header `x-prod-test-key`)
- `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` (for simulating callback)

Endpoint usage (safe guards enforced):
- POST JSON with `{ action: 'create-and-initiate', confirm: true }` to create a flagged test order (amount 1 INR) and initiate PhonePe payment; response includes the created order id and the SDK payment response (redirect url).

- POST JSON with `{ action: 'simulate-webhook', confirm: true, orderId: '<DB_ID>' }` to send a simulated callback for an existing flagged test order (only allowed if that order has `isProductionTest=true`).

Important: Both calls require header `x-prod-test-key: <PROD_TEST_KEY>` and confirmation `confirm: true`. This endpoint should only be used under supervision.
Notes
- The SDK `createSdkOrder` (token for mobile SDK) is not implemented in this patch but can be added if you need mobile SDK support.
- The webhook validation uses SDK's `validateCallback`. If your webhook config sends a raw hex token in `authorization` header, the SDK helper expects that format (see PhonePe docs).