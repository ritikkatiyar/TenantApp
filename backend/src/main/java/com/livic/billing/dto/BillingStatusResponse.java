package com.livic.billing.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillingStatusResponse {
    private SubscriptionDetailsDto subscription;
    private WalletDetailsDto wallet;
}
