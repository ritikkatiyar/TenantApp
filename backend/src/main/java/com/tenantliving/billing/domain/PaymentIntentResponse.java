package com.tenantliving.billing.domain;

public record PaymentIntentResponse(
    String transactionId,
    String clientSecret,
    String gatewayTransactionId,
    String paymentUrl,
    String status // PENDING, SUCCESS, FAILED
) {}
