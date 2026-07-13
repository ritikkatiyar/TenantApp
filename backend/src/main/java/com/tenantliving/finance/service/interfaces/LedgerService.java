package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.dto.LedgerDTOs.LedgerEntryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.UUID;

public interface LedgerService {
    Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
