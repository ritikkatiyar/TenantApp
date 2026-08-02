package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.finance.mapper.LeaseMapper;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.LeaseService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaseOrchestrationService {

    private final LeaseService leaseService;
    private final LeaseQueryService leaseQueryService;
    private final UserFacade userFacade;

    public List<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId) {
        List<LeaseTbl> leases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        return enrichLeases(leases);
    }

    public Optional<LeaseDTOs.LeaseResponse> getActiveTenantLease(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(this::enrichLease);
    }

    @Transactional
    public LeaseDTOs.LeaseResponse createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        LeaseTbl lease = leaseService.createLease(request, assignedByUserId);
        return enrichLease(lease);
    }

    public LeaseDTOs.LeaseResponse getLeaseById(UUID id) {
        LeaseTbl lease = leaseQueryService.getLeaseById(id);
        return enrichLease(lease);
    }

    @Transactional
    public void deleteLease(UUID id) {
        leaseService.deleteLease(id);
    }

    @Transactional
    public LeaseDTOs.LeaseResponse serveNotice(UUID id, LocalDate moveOutDate) {
        LeaseTbl lease = leaseService.updateNoticePeriod(id, moveOutDate);
        return enrichLease(lease);
    }

    private LeaseDTOs.LeaseResponse enrichLease(LeaseTbl lease) {
        UserSummaryDTO user = userFacade.getUserById(lease.getUserId()).orElse(null);
        return toResponse(lease, user);
    }

    private List<LeaseDTOs.LeaseResponse> enrichLeases(List<LeaseTbl> leases) {
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(
                leases.stream().map(LeaseTbl::getUserId).collect(Collectors.toSet())
        );
        return leases.stream()
                .map(lease -> toResponse(lease, usersMap.get(lease.getUserId())))
                .toList();
    }

    private LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease, UserSummaryDTO user) {
        String fullName = user != null ? user.fullName() : "Unknown User";
        String phone = user != null ? user.phoneNumber() : "";
        return LeaseMapper.toResponseWithDetails(lease, fullName, phone);
    }
}
