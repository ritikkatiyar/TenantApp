package com.livic.finance.dto;

import java.math.BigDecimal;

public record RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {
    public RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {
        this.expected = expected != null ? expected : BigDecimal.ZERO;
        this.collected = collected != null ? collected : BigDecimal.ZERO;
    }
}
