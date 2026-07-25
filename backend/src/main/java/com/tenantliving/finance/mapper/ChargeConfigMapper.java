package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.tenantliving.property.domain.PropertyTbl;

public final class ChargeConfigMapper {

    private ChargeConfigMapper() {
    }

    public static ChargeConfigTbl toEntity(ChargeConfigRequest request, PropertyTbl property) {
        return ChargeConfigTbl.builder()
                .property(property)
                .chargeName(request.getChargeName())
                .chargeCategory(request.getChargeCategory())
                .billingFrequency(request.getBillingFrequency())
                .calculationStrategy(request.getCalculationStrategy())
                .unitType(request.getUnitType())
                .baseRate(request.getBaseRate())
                .applySalesTax(request.getApplySalesTax())
                .lateFeePercentage(request.getLateFeePercentage())
                .autoCarryForward(request.getAutoCarryForward() != null ? request.getAutoCarryForward() : false)
                .isActive(true)
                .isSystemRequired(false)
                .build();
    }

    public static void updateEntity(ChargeConfigRequest request, ChargeConfigTbl config) {
        config.setChargeName(request.getChargeName());
        config.setChargeCategory(request.getChargeCategory());
        config.setBillingFrequency(request.getBillingFrequency());
        config.setCalculationStrategy(request.getCalculationStrategy());
        config.setUnitType(request.getUnitType());
        config.setBaseRate(request.getBaseRate());
        config.setApplySalesTax(request.getApplySalesTax());
        config.setLateFeePercentage(request.getLateFeePercentage());
        if (request.getAutoCarryForward() != null) {
            config.setAutoCarryForward(request.getAutoCarryForward());
        }
    }

    public static ChargeConfigResponse toResponse(ChargeConfigTbl config) {
        return ChargeConfigResponse.builder()
                .id(config.getId())
                .propertyId(config.getProperty().getId())
                .chargeName(config.getChargeName())
                .chargeCategory(config.getChargeCategory())
                .billingFrequency(config.getBillingFrequency())
                .calculationStrategy(config.getCalculationStrategy())
                .unitType(config.getUnitType())
                .baseRate(config.getBaseRate())
                .applySalesTax(config.getApplySalesTax())
                .lateFeePercentage(config.getLateFeePercentage())
                .isSystemRequired(config.getIsSystemRequired())
                .isActive(config.getIsActive())
                .autoCarryForward(config.getAutoCarryForward())
                .build();
    }
}
