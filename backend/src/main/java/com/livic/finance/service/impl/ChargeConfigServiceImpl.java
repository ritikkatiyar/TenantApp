package com.livic.finance.service.impl;

import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.livic.finance.mapper.ChargeConfigMapper;
import com.livic.finance.service.ChargeConfigService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.finance.service.interfaces.MeterReadingCrudService;
import com.livic.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.service.interfaces.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.livic.common.exception.BusinessException;
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
        ChargeConfigTbl config = ChargeConfigMapper.toEntity(request, property);
        chargeConfigCrudService.save(config);
        return ChargeConfigMapper.toResponse(config);
    }

    @Override
    public ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request) {
        ChargeConfigTbl config = chargeConfigCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Charge Config not found"));
        ChargeConfigMapper.updateEntity(request, config);
        chargeConfigCrudService.save(config);
        return ChargeConfigMapper.toResponse(config);
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


}
