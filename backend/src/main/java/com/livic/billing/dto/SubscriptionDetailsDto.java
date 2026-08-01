package com.livic.billing.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class SubscriptionDetailsDto {
    private String id;
    private String userId;
    private String planName;
    private String status;
    private BigDecimal price;
    private String currentPeriodStart;
    private String currentPeriodEnd;
    private Boolean autoRenew;
    private String gatewaySubscriptionId;
}
