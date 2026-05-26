package com.tenantliving.billing.domain;

public record PaymentIntentRequest(
    String userId,
    double amount,
    String currency,
    String description,
    String email,
    PaymentGatewayType gateway
) {}
