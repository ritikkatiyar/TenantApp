package com.tenantliving.finance.service;

import com.tenantliving.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.tenantliving.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;

import java.util.List;
import java.util.UUID;

public interface BillingWorksheetService {
    List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth);
    void saveWorksheet(WorksheetSaveRequest request);
}
