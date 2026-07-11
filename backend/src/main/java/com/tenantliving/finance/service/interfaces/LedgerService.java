package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.dto.LedgerDTOs.LedgerEntryResponse;
import java.util.List;
import java.util.UUID;

public interface LedgerService {
    List<LedgerEntryResponse> getLedgerForProperty(UUID propertyId);
}
