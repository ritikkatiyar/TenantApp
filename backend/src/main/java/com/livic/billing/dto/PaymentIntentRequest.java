package com.livic.billing.dto;

import com.livic.billing.domain.PaymentGatewayType;

public record PaymentIntentRequest(
    String userId,
    double amount,
    String currency,
    String description,
    String email,
    PaymentGatewayType gateway
) {}
