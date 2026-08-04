package com.livic.finance.service.interfaces;

import com.livic.finance.dto.LeaseDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeaseOrchestrationService {
    List<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId);
    Page<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId, Pageable pageable);
    Optional<LeaseDTOs.LeaseResponse> getActiveTenantLease(UUID userId);
    LeaseDTOs.LeaseResponse createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    LeaseDTOs.LeaseResponse getLeaseById(UUID id);
    LeaseDTOs.LeaseResponse terminateLease(UUID id);
    LeaseDTOs.LeaseResponse serveNotice(UUID id, LocalDate moveOutDate);
}
