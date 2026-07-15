package com.tenantliving.finance.service.impl;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.tenantliving.finance.service.ChargeConfigService;
import com.tenantliving.finance.service.interfaces.ChargeConfigCrudService;
import com.tenantliving.finance.service.interfaces.BillingWorksheetCrudService;
import com.tenantliving.finance.service.interfaces.MeterReadingCrudService;
import com.tenantliving.finance.service.interfaces.RentCycleChargeCrudService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tenantliving.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ChargeConfigServiceImpl implements ChargeConfigService {

    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyQueryService propertyQueryService;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final MeterReadingCrudService meterReadingCrudService;
    private final RentCycleChargeCrudService rentCycleChargeCrudService;

    @Override
    public ChargeConfigResponse createChargeConfig(ChargeConfigRequest request) {
        PropertyTbl property = propertyQueryService.getPropertyById(request.getPropertyId());

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
                .isSystemRequired(false)
                .build();

        chargeConfigCrudService.save(config);
        return mapToResponse(config);
    }

    @Override
    public ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        config.setChargeName(request.getChargeName());
        config.setChargeCategory(request.getChargeCategory());
        config.setBillingFrequency(request.getBillingFrequency());
        config.setCalculationStrategy(request.getCalculationStrategy());
        config.setUnitType(request.getUnitType());
        config.setBaseRate(request.getBaseRate());
        config.setApplySalesTax(request.getApplySalesTax());
        config.setLateFeePercentage(request.getLateFeePercentage());
        config.setAutoCarryForward(request.getAutoCarryForward() != null ? request.getAutoCarryForward() : false);

        chargeConfigCrudService.save(config);
        return mapToResponse(config);
    }

    @Override
    public void deactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot deactivate a system-required charge configuration.");
        }

        config.setIsActive(false);
        chargeConfigCrudService.save(config);
    }

    @Override
    public void reactivateChargeConfig(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));
        config.setIsActive(true);
        chargeConfigCrudService.save(config);
    }

    @Override
    public void deleteChargeConfigPermanently(UUID id) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));

        if (Boolean.TRUE.equals(config.getIsSystemRequired())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete a system-required charge configuration.");
        }

        if (billingWorksheetCrudService.existsByChargeConfigId(id) ||
                meterReadingCrudService.existsByChargeConfigId(id) ||
                rentCycleChargeCrudService.existsByCustomChargeConfigId(id)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Cannot permanently delete this charge configuration because it has historical billing records. Please keep it deactivated instead.");
        }

        chargeConfigCrudService.delete(config);
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
