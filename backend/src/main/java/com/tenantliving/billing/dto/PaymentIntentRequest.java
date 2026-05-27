package com.tenantliving.billing.dto;

import com.tenantliving.billing.domain.PaymentGatewayType;

public record PaymentIntentRequest(
    String userId,
    double amount,
    String currency,
    String description,
    String email,
    PaymentGatewayType gateway
) {}
