package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import java.util.List;
import java.util.UUID;

public interface ChargeConfigQueryService {
    List<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive);
    ChargeConfigResponse getChargeConfigById(UUID id);
}
