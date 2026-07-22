package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;

import java.math.BigDecimal;

public final class LeaseMapper {
    private LeaseMapper() {
    }

    public static LeaseDTOs.LeaseResponse toResponse(LeaseTbl lease) {
        String unitNumber = lease.getUnit() != null ? lease.getUnit().getUnitNumber() : null;
        String propertyName = (lease.getUnit() != null && lease.getUnit().getProperty() != null) 
                ? lease.getUnit().getProperty().getName() : null;
        BigDecimal rentAmount = BigDecimal.ZERO;

        return new LeaseDTOs.LeaseResponse(
                lease.getId(),
                lease.getUserId(),
                lease.getUnit() != null ? lease.getUnit().getId() : null,
                unitNumber,
                propertyName,
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
