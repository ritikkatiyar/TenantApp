package com.tenantliving.billing.domain;

public record SubscriptionResponse(
    String subscriptionId,
    String gatewaySubscriptionId,
    String checkoutUrl,
    String status
) {}
