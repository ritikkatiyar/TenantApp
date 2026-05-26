import { apiRequest } from './client';

export type SubscriptionDetails = {
  id: string;
  userId: string;
  planName: 'STARTER' | 'LANDLORD_PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  price: number;
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
  gateway: 'STRIPE' | 'RAZORPAY' | 'PAYPAL';
};

export type TopUpRequestPayload = {
  amount: number;
  gateway: 'STRIPE' | 'RAZORPAY' | 'PAYPAL';
};

export type SubscriptionResponse = {
  subscriptionId: string;
  gatewaySubscriptionId: string;
  checkoutUrl: string;
  status: string;
};

export type PaymentIntentResponse = {
  transactionId: string;
  clientSecret: string;
  gatewayTransactionId: string;
  paymentUrl: string;
  status: string;
};

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
