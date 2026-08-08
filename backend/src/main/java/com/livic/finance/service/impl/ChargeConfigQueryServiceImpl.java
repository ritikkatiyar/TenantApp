package com.livic.finance.service.impl;

import com.livic.common.domain.BillingFrequency;
import com.livic.common.domain.CalculationStrategyType;
import com.livic.common.domain.ChargeCategory;
import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.livic.finance.mapper.ChargeConfigMapper;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.user.domain.UserMode;
import com.livic.user.facade.UserFacade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ChargeConfigQueryServiceImpl implements ChargeConfigQueryService {

    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;

    @Override
    public List<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive, UUID userId) {
        List<ChargeConfigTbl> configs = new ArrayList<>(includeInactive ? 
                chargeConfigCrudService.findAllByPropertyId(propertyId) : 
                chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId));

        boolean hasRentConfig = configs.stream()
                .anyMatch(c -> c.getChargeCategory() == ChargeCategory.RENT);

        if (!hasRentConfig) {
            PropertySummaryDTO propSummary = propertyFacade.getPropertyById(propertyId).orElse(null);
            if (propSummary != null) {
                UserMode activeMode = userFacade.getActiveModeForUser(userId);
                if (activeMode == UserMode.RENTAL) {
                    ChargeConfigTbl systemRentConfig = ChargeConfigMapper.createSystemRentConfig(propSummary.id());
                    systemRentConfig = chargeConfigCrudService.save(systemRentConfig);
                    configs.add(0, systemRentConfig);
                }
            }
        }

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
