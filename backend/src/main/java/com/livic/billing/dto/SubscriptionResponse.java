package com.livic.billing.dto;

public record SubscriptionResponse(
    String subscriptionId,
    String gatewaySubscriptionId,
    String checkoutUrl,
    String status
) {}
