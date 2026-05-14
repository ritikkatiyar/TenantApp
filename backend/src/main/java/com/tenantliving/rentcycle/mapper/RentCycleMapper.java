package com.tenantliving.rentcycle.mapper;

import com.tenantliving.rentcycle.domain.RentCycleChargeTbl;
import com.tenantliving.rentcycle.domain.RentCycleTbl;
import com.tenantliving.rentcycle.dto.RentCycleDTOs;

import java.util.List;

public final class RentCycleMapper {
    private RentCycleMapper() {
    }

    public static RentCycleDTOs.RentCycleResponse toResponse(
            RentCycleTbl cycle,
            List<RentCycleChargeTbl> charges
    ) {
        return new RentCycleDTOs.RentCycleResponse(
                cycle.getId(),
                cycle.getLease().getId(),
                cycle.getBillingMonth(),
                cycle.getBaseAmount(),
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
