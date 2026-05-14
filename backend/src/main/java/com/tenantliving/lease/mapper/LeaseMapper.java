package com.tenantliving.lease.mapper;

import com.tenantliving.lease.domain.LeaseTbl;
import com.tenantliving.lease.dto.LeaseDTOs;

public final class LeaseMapper {
    private LeaseMapper() {
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease) {
        return new LeaseDTOs.LeaseResponse(
                lease.getId(),
                lease.getUserId(),
                lease.getUnit().getId(),
                lease.getRentAmount(),
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
