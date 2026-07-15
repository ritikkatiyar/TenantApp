package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.auth.service.interfaces.MembershipService;

import com.tenantliving.finance.service.interfaces.LeaseCrudService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaseServiceImpl implements LeaseService {

    private final LeaseCrudService leaseCrudService;
    private final UnitQueryService unitQueryService;
    private final UserQueryService userQueryService;
    private final MembershipService membershipService;

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request) {
        return createLease(request, null);
    }

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        UserTbl tenant = userQueryService.getUserById(request.userId());
        UnitTbl unit = unitQueryService.getUnitById(request.unitId());
        
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }
        if (unit.getCapacity() == null || unit.getCapacity() <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unit capacity must be defined before assigning tenants.");
        }
        int activeLeaseCount = leaseCrudService.findByUnitIdAndStatus(unit.getId(), LeaseStatus.ACTIVE).size();
        if (activeLeaseCount >= unit.getCapacity()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Unit capacity of " + unit.getCapacity() + " has been reached.");
        }

        membershipService.ensureTenantRole(tenant.getId(), unit.getProperty().getId(), assignedByUserId);

        LeaseTbl lease = LeaseTbl.builder()
                .userId(request.userId())
                .unit(unit)
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
        LeaseTbl saved = leaseCrudService.save(lease);
        log.info("lease_created leaseId={} userId={} unitId={} status={}",
                saved.getId(), saved.getUserId(), saved.getUnit().getId(), saved.getStatus());
        return saved;
    }

    @Override
    public void deleteLease(UUID id) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        UUID tenantId = lease.getUserId();
        UUID propertyId = lease.getUnit().getProperty().getId();

        leaseCrudService.delete(lease);

        // Check if this tenant has any other active leases in any unit of the same property
        boolean hasOtherLeases = leaseCrudService.existsByUserIdAndPropertyIdAndStatus(
                tenantId, propertyId, LeaseStatus.ACTIVE
        );

        if (!hasOtherLeases) {
            membershipService.removeTenantRole(tenantId, propertyId);
        }
    }
}
