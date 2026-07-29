package com.livic.payment.service;

import com.livic.billing.domain.PaymentGatewayType;
import com.livic.billing.dto.PaymentIntentRequest;
import com.livic.billing.dto.PaymentIntentResponse;
import com.livic.billing.dto.SubscriptionRequest;
import com.livic.billing.dto.SubscriptionResponse;

public interface PaymentGatewayService {
    
    /**
     * Identifies which gateway implementation this service handles (Stripe, Razorpay, etc.)
     */
    PaymentGatewayType getSupportedGateway();

    /**
     * Initializes a standard single charge or top-up (e.g., buying AI credits).
     */
    PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request);

    /**
     * Initializes a recurring SaaS subscription.
     */
    SubscriptionResponse createSubscription(SubscriptionRequest request);

    /**
     * Cancels an active recurring SaaS subscription.
     */
    boolean cancelSubscription(String gatewaySubscriptionId);

    /**
     * Handles standard incoming webhooks from the payment gateway.
     */
    void handleWebhook(String payload, String signatureHeader);
}
