/** Minimal Razorpay order.create response fields used by the app. */
export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

/** Razorpay orders.create request shape used by this app. */
export type RazorpayOrderCreateParams = {
  amount: number;
  currency: string;
  receipt: string;
  payment_capture: 0 | 1;
};

/** POST /api/payments/razorpay/order */
export type RazorpayOrderPayload = {
  receipt: string;
  currency: string;
  amount?: number;
};

/** POST /api/payments/razorpay/verify (matches checkout client field names). */
export type RazorpayVerifyPayload = {
  merchantOrderId?: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

/** POST /api/payments/phonepe */
export type PhonePeInitiatePayload = {
  orderId: string;
  amount?: number;
  redirectUrl?: string;
};

/** POST /api/payments/cashfree */
export type CashfreeCustomerDetails = {
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
};

export type CashfreeInitiatePayload = {
  orderId: string;
  amount?: number;
  redirectUrl?: string;
  customerDetails?: CashfreeCustomerDetails;
};

/** PhonePe SDK pay() response — only fields read by initiate route. */
export type PhonePePayResponse = {
  redirect_url?: string;
  redirectUrl?: string;
  state?: string;
  order_id?: string;
  orderId?: string;
  expire_at?: string;
  data?: {
    instrumentResponse?: { redirectInfo?: { url?: string } };
    redirect_url?: string;
    redirectUrl?: string;
    orderId?: string;
    state?: string;
    expire_at?: string;
  };
};

/** PhonePe getOrderStatus() response — only fields read by callback route. */
export type PhonePeOrderStatusResponse = {
  code?: string;
  success?: boolean;
  state?: string;
  data?: {
    state?: string;
    status?: string;
    code?: string;
    transactionId?: string;
    paymentDetails?: Array<{ transactionId?: string }>;
    payment_details?: Array<{ transactionId?: string }>;
  };
};

/** Cashfree order API response — fields used by initiate route. */
export type CashfreeOrderApiResponse = {
  order_id?: string;
  order_token?: string;
};

/** Cashfree session API response — fields used by initiate route. */
export type CashfreeSessionApiResponse = {
  payment_session_id?: string;
};

/** Cashfree order status fetch — fields used by callback route. */
export type CashfreeOrderStatusResponse = {
  order_status?: string;
  status?: string;
};

/** Razorpay webhook body — fields used by callback route. */
export type RazorpayWebhookPayload = {
  event?: string;
  event_type?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
  payment?: RazorpayPaymentEntity;
};

export type RazorpayPaymentEntity = {
  id?: string;
  payment_id?: string;
  order_id?: string;
  orderId?: string;
};

/** PhonePe webhook body — fields used by callback route. */
export type PhonePeWebhookPayload = {
  event?: string;
  data?: PhonePeWebhookData;
};

export type PhonePeWebhookData = {
  merchantTransactionId?: string;
  merchantOrderId?: string;
  originalMerchantOrderId?: string;
  orderId?: string;
  transactionId?: string;
  paymentDetails?: Array<{ transactionId?: string }>;
  payment_details?: Array<{ transactionId?: string }>;
};

/** Cashfree webhook body — fields used by callback route. */
export type CashfreeWebhookPayload = {
  order_id?: string;
  orderId?: string;
  payment_id?: string;
  paymentId?: string;
  order_status?: string;
  status?: string;
  data?: {
    order_id?: string;
    orderId?: string;
    payment_id?: string;
    paymentId?: string;
    paymentStatus?: string;
  };
};

/** PhonePe prod-test POST body. */
export type PhonePeProdTestPayload = {
  action: 'create-and-initiate' | 'simulate-webhook';
  confirm: boolean;
  orderId?: string;
};

/** Minimal PhonePe SDK client surface used by payment routes. */
export type PhonePeCheckoutClient = {
  pay: (request: unknown) => Promise<PhonePePayResponse>;
  getOrderStatus?: (merchantOrderId: string) => Promise<PhonePeOrderStatusResponse>;
  checkStatus?: (merchantOrderId: string) => Promise<PhonePeOrderStatusResponse>;
  status?: (merchantOrderId: string) => Promise<PhonePeOrderStatusResponse>;
  validateCallback?: (
    username: string,
    password: string,
    authorizationHeader: string,
    responseBody: string,
  ) => boolean | PhonePeCallbackValidation;
};

export type PhonePeCallbackValidation =
  | boolean
  | {
      isValid?: boolean;
      valid?: boolean;
      payload?: unknown;
      type?: string;
    };
