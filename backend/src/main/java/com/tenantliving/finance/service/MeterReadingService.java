package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingRequest;

import java.util.List;
import java.util.UUID;

public interface MeterReadingService {
    List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year);
    void batchSaveReadings(MeterReadingRequest request);
}
