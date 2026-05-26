package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingRequest;
import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingResponse;

import java.util.List;
import java.util.UUID;

public interface MeterReadingService {
    
    // Generates the worksheet: creates blank rows for all active units if they don't exist yet, 
    // copies previous month's reading as `previousReading`, and returns them.
    List<MeterReadingResponse> getOrCreateMeterReadingsForMonth(UUID propertyId, UUID chargeConfigId, Integer month, Integer year);
    
    // Batch saves the readings the admin typed in
    void saveMeterReadings(MeterReadingRequest request);
}
