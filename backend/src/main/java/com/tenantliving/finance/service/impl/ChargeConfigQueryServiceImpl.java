package com.tenantliving.finance.service.impl;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.tenantliving.finance.service.ChargeConfigQueryService;
import com.tenantliving.finance.service.interfaces.ChargeConfigCrudService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChargeConfigQueryServiceImpl implements ChargeConfigQueryService {

    private final ChargeConfigCrudService chargeConfigCrudService;

    @Override
    public List<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive) {
        List<ChargeConfigTbl> configs = includeInactive ? 
                chargeConfigCrudService.findAllByPropertyId(propertyId) : 
                chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId);
        return configs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChargeConfigResponse getChargeConfigById(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Charge Config not found"));
        return mapToResponse(config);
    }

    private ChargeConfigResponse mapToResponse(ChargeConfigTbl config) {
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
