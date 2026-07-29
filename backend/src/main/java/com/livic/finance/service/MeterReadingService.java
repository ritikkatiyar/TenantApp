package com.livic.finance.service;

import com.livic.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.livic.finance.dto.MeterReadingDTOs.MeterReadingRequest;

import java.util.List;
import java.util.UUID;

public interface MeterReadingService {
    List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year);
    void batchSaveReadings(MeterReadingRequest request);
}
