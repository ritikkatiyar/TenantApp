package com.livic.finance.mapper;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.property.domain.UnitTbl;
import com.livic.user.domain.UserTbl;

import java.math.BigDecimal;
import java.util.UUID;

public final class LeaseMapper {
    private LeaseMapper() {
    }

    public static LeaseTbl toEntity(LeaseDTOs.CreateLeaseRequest request, UnitTbl unit, UUID targetUserId) {
        return LeaseTbl.builder()
                .userId(targetUserId)
                .unit(unit)
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease) {
        return toResponse(lease, null);
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease, UserTbl user) {
        String unitNumber = lease.getUnit() != null ? lease.getUnit().getUnitNumber() : null;
        String propertyName = (lease.getUnit() != null && lease.getUnit().getProperty() != null) 
                ? lease.getUnit().getProperty().getName() : null;
        BigDecimal rentAmount = BigDecimal.ZERO;
        
        String tenantName = user != null ? user.getFullName() : null;
        String tenantPhone = user != null ? user.getPhoneNumber() : null;

        return new LeaseDTOs.LeaseResponse(
                lease.getId(),
                lease.getUserId(),
                lease.getUnit() != null ? lease.getUnit().getId() : null,
                unitNumber,
                propertyName,
                tenantName,
                tenantPhone,
                rentAmount,
                lease.getSecurityDeposit(),
                lease.getSplitStrategy(),
                lease.getMoveInDate(),
                lease.getMoveOutDate(),
                lease.getStatus(),
                lease.getCreatedAt(),
                lease.getUpdatedAt()
        );
    }
}
