package com.livic.finance.service;

import com.livic.finance.dto.ChargeConfigRequest;
import com.livic.finance.dto.ChargeConfigResponse;
import java.util.UUID;

public interface ChargeConfigService {
    ChargeConfigResponse createChargeConfig(ChargeConfigRequest request);
    ChargeConfigResponse updateChargeConfig(UUID id, ChargeConfigRequest request);
    void deactivateChargeConfig(UUID id);
    void reactivateChargeConfig(UUID id);
    void deleteChargeConfigPermanently(UUID id);
}
