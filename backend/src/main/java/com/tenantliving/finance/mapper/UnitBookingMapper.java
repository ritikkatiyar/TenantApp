package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.UnitBookingTbl;
import com.tenantliving.finance.dto.UnitBookingDTOs;
import com.tenantliving.property.domain.UnitTbl;

public final class UnitBookingMapper {

    private UnitBookingMapper() {
    }

    public static UnitBookingTbl toEntity(UnitBookingDTOs.CreateBookingRequest request, UnitTbl unit) {
        return UnitBookingTbl.builder()
                .unit(unit)
                .prospectiveTenantUserId(request.prospectiveTenantUserId())
                .prospectiveTenantName(request.prospectiveTenantName())
                .prospectiveTenantPhone(request.prospectiveTenantPhone())
                .prospectiveTenantEmail(request.prospectiveTenantEmail())
                .tokenAmount(request.tokenAmount())
                .expectedMoveInDate(request.expectedMoveInDate())
                .status("BOOKED")
                .build();
    }

    public static UnitBookingDTOs.UnitBookingResponse toResponse(UnitBookingTbl booking) {
        return new UnitBookingDTOs.UnitBookingResponse(
                booking.getId(),
                booking.getUnit().getId(),
                booking.getUnit().getUnitNumber(),
                booking.getProspectiveTenantUserId(),
                booking.getProspectiveTenantName(),
                booking.getProspectiveTenantPhone(),
                booking.getProspectiveTenantEmail(),
                booking.getTokenAmount(),
                booking.getExpectedMoveInDate(),
                booking.getStatus(),
                booking.getPaymentTransaction() != null ? booking.getPaymentTransaction().getId() : null,
                booking.getConvertedLeaseId(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
