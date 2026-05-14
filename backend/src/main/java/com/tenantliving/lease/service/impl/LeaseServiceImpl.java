package com.tenantliving.lease.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.lease.domain.LeaseTbl;
import com.tenantliving.lease.dto.LeaseDTOs;
import com.tenantliving.lease.repository.LeaseRepository;
import com.tenantliving.lease.service.interfaces.LeaseService;
import com.tenantliving.unit.domain.UnitTbl;
import com.tenantliving.unit.service.interfaces.UnitService;
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

    @Override
    @Transactional
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request) {
        userService.getUserById(request.userId());
        UnitTbl unit = unitService.getUnitById(request.unitId());
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }

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
}
