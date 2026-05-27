package com.tenantliving.billing.dto;

import com.tenantliving.billing.domain.PaymentGatewayType;

public record SubscriptionRequest(
    String userId,
    String planName,
    double amount,
    String billingCycle, // MONTHLY, YEARLY
    PaymentGatewayType gateway
) {}
