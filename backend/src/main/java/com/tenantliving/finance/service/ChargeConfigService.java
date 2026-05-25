package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;

import java.util.List;
import java.util.UUID;

public interface ChargeConfigService {

    ChargeConfigResponse createChargeConfig(ChargeConfigRequest request);

    ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request);

    void deactivateChargeConfig(UUID id);

    List<ChargeConfigResponse> getActiveChargesForProperty(UUID propertyId);
    
    ChargeConfigResponse getChargeConfigById(UUID id);
}
