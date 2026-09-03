package com.livic.analytics.dto;

import java.math.BigDecimal;

public record DefaulterResponse(
        String tenantName,
        String unitNumber,
        String propertyName,
        int daysOverdue,
        BigDecimal amountDue,
        String rentCycleId
) {}
