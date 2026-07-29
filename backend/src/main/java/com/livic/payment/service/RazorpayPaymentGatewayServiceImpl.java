package com.livic.payment.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.livic.billing.domain.PaymentGatewayType;
import com.livic.billing.dto.PaymentIntentRequest;
import com.livic.billing.dto.PaymentIntentResponse;
import com.livic.billing.dto.SubscriptionRequest;
import com.livic.billing.dto.SubscriptionResponse;
import com.livic.payment.config.RazorpayProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentGatewayServiceImpl implements PaymentGatewayService {

    private final RazorpayProperties razorpayProperties;

    @Override
    public PaymentGatewayType getSupportedGateway() {
        return PaymentGatewayType.RAZORPAY;
    }

    @Override
    public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request) {
        log.info("[RAZORPAY] Initializing payment intent for user: {}, amount: {}", request.userId(), request.amount());
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayProperties.getKeyId(), razorpayProperties.getKeySecret());
            JSONObject orderRequest = new JSONObject();
            // Razorpay amount is in paise (1 INR = 100 paise)
            orderRequest.put("amount", (int) (request.amount() * 100));
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + UUID.randomUUID().toString().substring(0, 8));

            Order order = razorpay.orders.create(orderRequest);
            String orderId = order.get("id");

            return new PaymentIntentResponse(
                    orderId,
                    null, // Client secret not used in Razorpay order flow
                    orderId,
                    null, // Standard checkout page handled on RN client with options
                    "INITIATED"
            );
        } catch (Exception e) {
            log.error("[RAZORPAY] Error creating order", e);
            throw new RuntimeException("Razorpay order creation failed", e);
        }
    }

    @Override
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        log.info("[RAZORPAY] Subscriptions not fully implemented, returning mock response");
        return new SubscriptionResponse(
                UUID.randomUUID().toString(),
                "sub_rzp_mock_" + UUID.randomUUID().toString().substring(0, 8),
                "https://mock.razorpay.com",
                "ACTIVE"
        );
    }

    @Override
    public boolean cancelSubscription(String gatewaySubscriptionId) {
        log.info("[RAZORPAY] Subscription cancellation requested: {}", gatewaySubscriptionId);
        return true;
    }

    @Override
    public void handleWebhook(String payload, String signatureHeader) {
        log.info("[RAZORPAY] Webhook handling delegated to specialized webhook endpoint");
    }
}
