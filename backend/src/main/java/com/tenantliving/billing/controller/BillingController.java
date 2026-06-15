package com.tenantliving.billing.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.billing.domain.BillingWalletTbl;
import com.tenantliving.billing.domain.PaymentGatewayType;
import com.tenantliving.billing.domain.SaasSubscriptionTbl;
import com.tenantliving.billing.dto.PaymentIntentRequest;
import com.tenantliving.billing.dto.PaymentIntentResponse;
import com.tenantliving.billing.dto.SubscriptionRequest;
import com.tenantliving.billing.dto.SubscriptionResponse;
import com.tenantliving.billing.service.PaymentGatewayRouter;
import com.tenantliving.billing.service.interfaces.BillingWalletService;
import com.tenantliving.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Slf4j
    /**
     * SaaS Billing
     * SaaS pricing, recurring subscriptions, and pre-paid wallets
     */

public class BillingController {

    private final BillingWalletService walletService;
    private final PaymentGatewayRouter paymentGatewayRouter;

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
        /**
     * Get billing and wallet status
     * Retrieves active subscription tier and remaining AI credit balance.
     */

    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(@AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        SaasSubscriptionTbl subscription = walletService.getActiveSubscription(userId);
        BillingWalletTbl wallet = walletService.getOrCreateWallet(userId);

        Map<String, Object> data = new HashMap<>();
        data.put("subscription", subscription);
        data.put("wallet", wallet);

        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/subscribe")
    @PreAuthorize("isAuthenticated()")
        /**
     * Subscribe to plan
     * Initiates a recurring subscription setup session via the selected payment gateway.
     */

    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody SubscriptionRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        
        // Always extract userId from security context
        SubscriptionRequest secureRequest = new SubscriptionRequest(
                userId.toString(),
                request.planName(),
                request.amount(),
                request.billingCycle(),
                request.gateway() != null ? request.gateway() : PaymentGatewayType.STRIPE
        );

        SubscriptionResponse response = paymentGatewayRouter
                .getGateway(secureRequest.gateway())
                .createSubscription(secureRequest);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/topup")
    @PreAuthorize("isAuthenticated()")
        /**
     * Top up AI wallet
     * Initiates a single charge checkout session to load credit tokens into the user's pre-paid wallet.
     */

    public ResponseEntity<ApiResponse<PaymentIntentResponse>> topUpWallet(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody PaymentIntentRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());

        PaymentIntentRequest secureRequest = new PaymentIntentRequest(
                userId.toString(),
                request.amount(),
                request.currency() != null ? request.currency() : "USD",
                "AI Credit Wallet Top-up",
                currentUser.getUsername(),
                request.gateway() != null ? request.gateway() : PaymentGatewayType.STRIPE
        );

        PaymentIntentResponse response = paymentGatewayRouter
                .getGateway(secureRequest.gateway())
                .createPaymentIntent(secureRequest);

        // Auto-fulfill the payment instantly for mock ease & front-end validation
        double creditsToAdd = request.amount() * 50.0; // $1 = 50 credits rate
        walletService.creditWallet(userId, creditsToAdd, "WALLET_TOPUP", response.transactionId());

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/webhooks/{gateway}")
        /**
     * Gateway Webhooks
     * Standard incoming endpoint to receive payment state notifications.
     */

    public ResponseEntity<Void> handleWebhook(
            @PathVariable String gateway,
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String signatureHeader
    ) {
        log.info("[WEBHOOK] Received payload for gateway: {}", gateway);
        PaymentGatewayType gatewayType = PaymentGatewayType.valueOf(gateway.toUpperCase());
        paymentGatewayRouter.getGateway(gatewayType).handleWebhook(payload, signatureHeader);
        return ResponseEntity.ok().build();
    }
}
