package com.tenantliving.finance.dto;

import com.tenantliving.common.domain.BillingFrequency;
import com.tenantliving.common.domain.CalculationStrategyType;
import com.tenantliving.common.domain.ChargeCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

public class ChargeConfigDTOs {

    @Data
    public static class ChargeConfigRequest {
        private UUID propertyId;
        private String chargeName;
        private ChargeCategory chargeCategory;
        private BillingFrequency billingFrequency;
        private CalculationStrategyType calculationStrategy;
        private BigDecimal baseRate;
        private Boolean applySalesTax;
        private BigDecimal lateFeePercentage;
    }

    @Data
    @Builder
    public static class ChargeConfigResponse {
        private UUID id;
        private UUID propertyId;
        private String chargeName;
        private ChargeCategory chargeCategory;
        private BillingFrequency billingFrequency;
        private CalculationStrategyType calculationStrategy;
        private BigDecimal baseRate;
        private Boolean applySalesTax;
        private BigDecimal lateFeePercentage;
        private Boolean isSystemRequired;
        private Boolean isActive;
    }
}
