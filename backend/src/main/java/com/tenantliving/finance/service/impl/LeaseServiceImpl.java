package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.PropertyRole;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaseServiceImpl implements LeaseService {

    private final LeaseRepository leaseRepository;
    private final UnitService unitService;
    private final UserService userService;
    private final com.tenantliving.property.service.interfaces.UserPropertyRoleService userPropertyRoleService;

    @Override
    @Transactional
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request) {
        return createLease(request, null);
    }

    @Override
    @Transactional
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        UserTbl tenant = userService.getUserById(request.userId());
        UnitTbl unit = unitService.getUnitById(request.unitId());
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }
        if (!leaseRepository.findByUnitIdAndStatus(unit.getId(), LeaseStatus.ACTIVE).isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Unit already has an active lease");
        }

        userPropertyRoleService.ensureTenantRole(tenant.getId(), unit.getProperty().getId(), assignedByUserId);

        LeaseTbl lease = LeaseTbl.builder()
                .userId(request.userId())
                .unit(unit)
                .rentAmount(request.rentAmount())
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
        LeaseTbl saved = leaseRepository.save(lease);
        log.info("lease_created leaseId={} userId={} unitId={} rentAmount={} status={}",
                saved.getId(), saved.getUserId(), saved.getUnit().getId(), saved.getRentAmount(), saved.getStatus());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public LeaseTbl getLeaseById(UUID id) {
        return leaseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUnitId(UUID unitId) {
        return leaseRepository.existsByUnit_Id(unitId);
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return leaseRepository.findByUserIdAndStatus(userId, status).stream().toList();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<UUID, LeaseTbl> findActiveLeasesByUnitIds(java.util.Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) return java.util.Collections.emptyMap();
        return leaseRepository.findByUnit_IdInAndStatus(unitIds, LeaseStatus.ACTIVE)
                .stream()
                .collect(java.util.stream.Collectors.toMap(l -> l.getUnit().getId(), l -> l));
    }
}
