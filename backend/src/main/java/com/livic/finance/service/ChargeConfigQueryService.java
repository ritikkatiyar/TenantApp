package com.livic.finance.service;

import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import java.util.List;
import java.util.UUID;

public interface ChargeConfigQueryService {
    List<ChargeConfigResponse> getChargesForProperty(UUID propertyId, boolean includeInactive, UUID userId);
    ChargeConfigResponse getChargeConfigById(UUID id);
}
