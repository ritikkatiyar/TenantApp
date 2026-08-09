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

    public static LeaseTbl toEntity(LeaseDTOs.CreateLeaseRequest request, UUID unitId, UUID targetUserId) {
        return LeaseTbl.builder()
                .userId(targetUserId)
                .unitId(unitId)
                .monthlyRentAmount(request.monthlyRentAmount())
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease) {
        return toResponse(lease, null, null, null, null);
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease, String unitNumber, String propertyName, String tenantName, String tenantPhone) {
        return new LeaseDTOs.LeaseResponse(
                lease.getId(),
                lease.getUserId(),
                lease.getUnitId(),
                unitNumber,
                propertyName,
                tenantName,
                tenantPhone,
                lease.getMonthlyRentAmount(),
                lease.getSecurityDeposit(),
                lease.getSplitStrategy(),
                lease.getMoveInDate(),
                lease.getMoveOutDate(),
                lease.getStatus(),
                lease.getCreatedAt(),
                lease.getUpdatedAt()
        );
    }

    public static LeaseDTOs.LeaseResponse toResponseWithDetails(LeaseTbl lease, String tenantName, String tenantPhone) {
        return toResponse(lease, null, null, tenantName, tenantPhone);
    }
    /**
     * Enriches a basic LeaseResponse (returned by the service layer) with user display fields.
     * Used by the orchestration layer after fetching tenant details from UserFacade.
     */
    public static LeaseDTOs.LeaseResponse withUserDetails(LeaseDTOs.LeaseResponse response,
                                                           String tenantName, String tenantPhone) {
        return new LeaseDTOs.LeaseResponse(
                response.id(),
                response.userId(),
                response.unitId(),
                response.unitNumber(),
                response.propertyName(),
                tenantName,
                tenantPhone,
                response.monthlyRentAmount(),
                response.securityDeposit(),
                response.splitStrategy(),
                response.moveInDate(),
                response.moveOutDate(),
                response.status(),
                response.createdAt(),
                response.updatedAt()
        );
    }
}
