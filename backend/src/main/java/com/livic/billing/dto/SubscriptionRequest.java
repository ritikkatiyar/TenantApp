package com.livic.billing.dto;

import com.livic.billing.domain.PaymentGatewayType;

public record SubscriptionRequest(
    String userId,
    String planName,
    double amount,
    String billingCycle, // MONTHLY, YEARLY
    PaymentGatewayType gateway
) {}
