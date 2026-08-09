package com.livic.finance.mapper;

import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.property.domain.UnitTbl;

import com.livic.common.domain.UnitBookingStatus;

public final class UnitBookingMapper {

    private UnitBookingMapper() {
    }

    public static UnitBookingTbl toEntity(UnitBookingDTOs.CreateBookingRequest request, java.util.UUID unitId) {
        return UnitBookingTbl.builder()
                .unitId(unitId)
                .prospectiveTenantUserId(request.prospectiveTenantUserId())
                .prospectiveTenantName(request.prospectiveTenantName())
                .prospectiveTenantPhone(request.prospectiveTenantPhone())
                .prospectiveTenantEmail(request.prospectiveTenantEmail())
                .tokenAmount(request.tokenAmount())
                .expectedMoveInDate(request.expectedMoveInDate())
                .status(UnitBookingStatus.BOOKED.name())
                .build();
    }

    public static UnitBookingDTOs.UnitBookingResponse toResponse(UnitBookingTbl booking, String unitNumber) {
        return new UnitBookingDTOs.UnitBookingResponse(
                booking.getId(),
                booking.getUnitId(),
                unitNumber,
                booking.getProspectiveTenantUserId(),
                booking.getProspectiveTenantName(),
                booking.getProspectiveTenantPhone(),
                booking.getProspectiveTenantEmail(),
                booking.getTokenAmount(),
                booking.getExpectedMoveInDate(),
                booking.getStatus(),
                booking.getPaymentTransactionId(),
                booking.getConvertedLeaseId(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
