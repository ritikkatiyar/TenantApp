package com.livic.finance.mapper;

import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.property.domain.UnitTbl;

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
