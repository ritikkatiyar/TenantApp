package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.RentCycleChargeTbl;
import com.tenantliving.finance.domain.RentCycleTbl;
import com.tenantliving.finance.dto.RentCycleDTOs;

import java.util.List;

public final class RentCycleMapper {
    private RentCycleMapper() {
    }

    public static RentCycleDTOs.RentCycleResponse toResponse(
            RentCycleTbl cycle,
            String tenantName,
            String unitNumber,
            List<RentCycleChargeTbl> charges
    ) {
        return new RentCycleDTOs.RentCycleResponse(
                cycle.getId(),
                cycle.getLease().getId(),
                tenantName,
                unitNumber,
                cycle.getBillingMonth(),
                cycle.getTotalAmount(),
                cycle.getDueDate(),
                cycle.getStatus(),
                cycle.getPaidAt(),
                cycle.getCreatedAt(),
                cycle.getUpdatedAt(),
                charges.stream().map(RentCycleMapper::toResponse).toList()
        );
    }

    public static RentCycleDTOs.ChargeResponse toResponse(RentCycleChargeTbl charge) {
        return new RentCycleDTOs.ChargeResponse(
                charge.getId(),
                charge.getChargeType(),
                charge.getAmount(),
                charge.getDescription(),
                charge.getCreatedAt()
        );
    }
}
