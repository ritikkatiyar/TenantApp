import { apiRequest } from '@/src/api/client';

export type FeatureDisplayItem = {
  featureKey: string;
  displayLabel: string;
  limitValue: number;
  included: boolean;
};

export type PlanResponse = {
  id: string;
  planKey: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: FeatureDisplayItem[];
};

export type SubscriptionDetails = {
  id: string;
  userId: string;
  planName: 'STARTER' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE' | string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  price?: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  gatewaySubscriptionId?: string;
};

export type WalletDetails = {
  id: string;
  userId: string;
  creditBalance: number;
  currency: string;
  lastToppedUp?: string;
};

export type BillingStatusResponse = {
  subscription: SubscriptionDetails;
  wallet: WalletDetails;
};

export type SubscribeRequestPayload = {
  planName: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  gateway?: 'RAZORPAY' | 'STRIPE' | 'PAYPAL';
};

export type TopUpRequestPayload = {
  amount: number;
  gateway?: 'RAZORPAY' | 'STRIPE' | 'PAYPAL';
};

export type SubscriptionResponse = {
  subscriptionId: string;
  gatewaySubscriptionId: string;
  checkoutUrl: string;
  status: string;
};

export type PaymentIntentResponse = {
  transactionId: string;
  clientSecret?: string;
  gatewayTransactionId: string;
  paymentUrl?: string;
  status: string;
};

export function getPlans(token?: string): Promise<PlanResponse[]> {
  return apiRequest<PlanResponse[]>('/api/v1/billing/plans', {
    method: 'GET',
    token,
  });
}

export function getBillingStatus(token: string): Promise<BillingStatusResponse> {
  return apiRequest<BillingStatusResponse>('/api/v1/billing/status', {
    method: 'GET',
    token,
  });
}

export function subscribeToPlan(payload: SubscribeRequestPayload, token: string): Promise<SubscriptionResponse> {
  return apiRequest<SubscriptionResponse>('/api/v1/billing/subscribe', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function topUpWallet(payload: TopUpRequestPayload, token: string): Promise<PaymentIntentResponse> {
  return apiRequest<PaymentIntentResponse>('/api/v1/billing/topup', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export type PaymentVerificationPayload = {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
};

export function verifyPayment(payload: PaymentVerificationPayload, token: string): Promise<string> {
  return apiRequest<string>('/api/v1/payments/verify', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
