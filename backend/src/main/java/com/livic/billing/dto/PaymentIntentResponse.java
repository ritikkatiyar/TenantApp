package com.livic.billing.dto;

public record PaymentIntentResponse(
    String transactionId,
    String clientSecret,
    String gatewayTransactionId,
    String paymentUrl,
    String status // PENDING, SUCCESS, FAILED
) {}
