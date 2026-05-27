package com.tenantliving.billing.dto;

public record SubscriptionResponse(
    String subscriptionId,
    String gatewaySubscriptionId,
    String checkoutUrl,
    String status
) {}
