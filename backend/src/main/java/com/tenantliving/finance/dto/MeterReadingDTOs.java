package com.tenantliving.finance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MeterReadingDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MeterReadingRequest {
        private UUID propertyId;
        private UUID chargeConfigId;
        private Integer billingMonth;
        private Integer billingYear;
        private List<UnitReading> readings;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnitReading {
        private UUID unitId;
        private BigDecimal currentReading;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MeterReadingResponse {
        private UUID id;
        private UUID unitId;
        private String unitName; 
        private String tenantName;
        private Integer floor;
        private BigDecimal previousReading;
        private BigDecimal currentReading;
        private boolean isBilled;
    }
}
