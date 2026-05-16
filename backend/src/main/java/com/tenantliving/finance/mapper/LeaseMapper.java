package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;

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
