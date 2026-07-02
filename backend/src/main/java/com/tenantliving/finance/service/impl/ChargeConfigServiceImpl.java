package com.tenantliving.finance.service.impl;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.service.ChargeConfigService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChargeConfigServiceImpl implements ChargeConfigService {

    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyRepository propertyRepository;

    @Autowired
    public ChargeConfigServiceImpl(ChargeConfigRepository chargeConfigRepository, PropertyRepository propertyRepository) {
        this.chargeConfigRepository = chargeConfigRepository;
        this.propertyRepository = propertyRepository;
    }

    @Override
    public ChargeConfigResponse createChargeConfig(ChargeConfigRequest request) {
        PropertyTbl property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new IllegalArgumentException("Property not found"));

        ChargeConfigTbl config = ChargeConfigTbl.builder()
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
                .isSystemRequired(false) // Custom charges created by user are not system required
                .build();

        chargeConfigRepository.save(config);
        return mapToResponse(config);
    }

    @Override
    public ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request) {
        ChargeConfigTbl config = chargeConfigRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Active Charge Config not found"));

        // Do not allow property transfer
        config.setChargeName(request.getChargeName());
        config.setChargeCategory(request.getChargeCategory());
        config.setBillingFrequency(request.getBillingFrequency());
        config.setCalculationStrategy(request.getCalculationStrategy());
        config.setUnitType(request.getUnitType());
        config.setBaseRate(request.getBaseRate());
        config.setApplySalesTax(request.getApplySalesTax());
        config.setLateFeePercentage(request.getLateFeePercentage());
        config.setAutoCarryForward(request.getAutoCarryForward() != null ? request.getAutoCarryForward() : false);

        chargeConfigRepository.save(config);
        return mapToResponse(config);
    }

    @Override
    public void deactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Active Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new IllegalStateException("Cannot deactivate a system-required charge configuration.");
        }

        config.setIsActive(false);
        chargeConfigRepository.save(config);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChargeConfigResponse> getActiveChargesForProperty(UUID propertyId) {
        return chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ChargeConfigResponse getChargeConfigById(UUID id) {
        ChargeConfigTbl config = chargeConfigRepository.findByIdAndIsActiveTrue(id)
                .orElseThrow(() -> new IllegalArgumentException("Active Charge Config not found"));
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
