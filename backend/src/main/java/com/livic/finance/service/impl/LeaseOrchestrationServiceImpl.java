package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.finance.mapper.LeaseMapper;
import com.livic.finance.service.interfaces.LeaseOrchestrationService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.LeaseService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
public class LeaseOrchestrationServiceImpl implements LeaseOrchestrationService {

    private final LeaseService leaseService;
    private final LeaseQueryService leaseQueryService;
    private final UserFacade userFacade;

    @Override
    public List<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId) {
        List<LeaseTbl> leases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        return enrichLeases(leases);
    }

    @Override
    public Page<LeaseDTOs.LeaseResponse> getActiveLeasesByProperty(UUID propertyId, Pageable pageable) {
        Page<LeaseTbl> page = leaseQueryService.findActiveLeasesByProperty(propertyId, pageable);
        List<LeaseDTOs.LeaseResponse> content = enrichLeases(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Override
    public Optional<LeaseDTOs.LeaseResponse> getActiveTenantLease(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(this::enrichLease);
    }

    @Override
    @Transactional
    public LeaseDTOs.LeaseResponse createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        LeaseTbl lease = leaseService.createLease(request, assignedByUserId);
        return enrichLease(lease);
    }

    @Override
    public LeaseDTOs.LeaseResponse getLeaseById(UUID id) {
        LeaseTbl lease = leaseQueryService.getLeaseById(id);
        return enrichLease(lease);
    }

    @Override
    @Transactional
    public LeaseDTOs.LeaseResponse terminateLease(UUID id) {
        LeaseDTOs.LeaseResponse response = leaseService.terminateLease(id);
        UserSummaryDTO user = userFacade.getUserById(response.userId()).orElse(null);
        String fullName = user != null ? user.fullName() : "Unknown User";
        String phone = user != null ? user.phoneNumber() : "";
        return LeaseMapper.withUserDetails(response, fullName, phone);
    }

    @Override
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
