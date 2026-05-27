package com.tenantliving.billing.service;

import com.tenantliving.billing.domain.PaymentGatewayType;
import com.tenantliving.billing.dto.PaymentIntentRequest;
import com.tenantliving.billing.dto.PaymentIntentResponse;
import com.tenantliving.billing.dto.SubscriptionRequest;
import com.tenantliving.billing.dto.SubscriptionResponse;
import com.tenantliving.billing.domain.PaymentTransactionTbl;
import com.tenantliving.billing.domain.SaasSubscriptionTbl;
import com.tenantliving.billing.repository.PaymentTransactionRepository;
import com.tenantliving.billing.repository.SaasSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripePaymentGatewayServiceImpl implements PaymentGatewayService {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SaasSubscriptionRepository saasSubscriptionRepository;

    @Override
    public PaymentGatewayType getSupportedGateway() {
        return PaymentGatewayType.STRIPE;
    }

    @Override
    public PaymentIntentResponse createPaymentIntent(PaymentIntentRequest request) {
        log.info("[STRIPE] Initializing payment intent for user: {}, amount: {}", request.userId(), request.amount());

        String gatewayTxId = "ch_mock_" + UUID.randomUUID().toString().substring(0, 8);
        String clientSecret = "seti_mock_" + UUID.randomUUID();

        // 1. Create a PaymentTransaction record in PENDING state
        PaymentTransactionTbl paymentTx = PaymentTransactionTbl.builder()
                .userId(UUID.fromString(request.userId()))
                .gatewayName("STRIPE")
                .gatewayTransactionId(gatewayTxId)
                .amount(BigDecimal.valueOf(request.amount()))
                .status("PENDING")
                .build();
        paymentTx = paymentTransactionRepository.save(paymentTx);

        // Standard mock checkout URL
        String mockPaymentUrl = "https://checkout.stripe.com/pay/" + gatewayTxId;

        return new PaymentIntentResponse(
                paymentTx.getId().toString(),
                clientSecret,
                gatewayTxId,
                mockPaymentUrl,
                "PENDING"
        );
    }

    @Override
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        log.info("[STRIPE] Initializing recurring subscription for user: {}, plan: {}", request.userId(), request.planName());

        String gatewaySubId = "sub_mock_" + UUID.randomUUID().toString().substring(0, 8);

        // 1. Create SaasSubscription record in TRIALING / ACTIVE state (mocking Stripe checkout session response)
        SaasSubscriptionTbl sub = SaasSubscriptionTbl.builder()
                .userId(UUID.fromString(request.userId()))
                .planName(request.planName())
                .status("ACTIVE")
                .price(BigDecimal.valueOf(request.amount()))
                .currentPeriodStart(LocalDateTime.now())
                .currentPeriodEnd(LocalDateTime.now().plusMonths(1))
                .autoRenew(true)
                .gatewaySubscriptionId(gatewaySubId)
                .build();
        sub = saasSubscriptionRepository.save(sub);

        // 2. Also log a Payment Transaction
        PaymentTransactionTbl paymentTx = PaymentTransactionTbl.builder()
                .userId(UUID.fromString(request.userId()))
                .subscriptionId(sub.getId())
                .gatewayName("STRIPE")
                .gatewayTransactionId("tx_mock_" + UUID.randomUUID().toString().substring(0, 8))
                .amount(BigDecimal.valueOf(request.amount()))
                .status("SUCCESS")
                .build();
        paymentTransactionRepository.save(paymentTx);

        String mockCheckoutUrl = "https://checkout.stripe.com/pay/sub_" + gatewaySubId;

        return new SubscriptionResponse(
                sub.getId().toString(),
                gatewaySubId,
                mockCheckoutUrl,
                "ACTIVE"
        );
    }

    @Override
    public boolean cancelSubscription(String gatewaySubscriptionId) {
        log.info("[STRIPE] Cancelling subscription: {}", gatewaySubscriptionId);
        SaasSubscriptionTbl sub = saasSubscriptionRepository.findByGatewaySubscriptionId(gatewaySubscriptionId).orElse(null);
        if (sub != null) {
            sub.setStatus("CANCELED");
            sub.setAutoRenew(false);
            saasSubscriptionRepository.save(sub);
            return true;
        }
        return false;
    }

    @Override
    public void handleWebhook(String payload, String signatureHeader) {
        log.info("[STRIPE] Received webhook callback with payload: {}", payload);
        // Stripe webhook processing logic (e.g. updating transaction/subscription state upon payment completion events)
    }
}
