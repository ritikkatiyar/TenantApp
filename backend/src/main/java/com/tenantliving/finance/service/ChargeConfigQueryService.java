package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import java.util.List;
import java.util.UUID;

public interface ChargeConfigQueryService {
    List<ChargeConfigResponse> getActiveChargesForProperty(UUID propertyId);
    ChargeConfigResponse getChargeConfigById(UUID id);
}
