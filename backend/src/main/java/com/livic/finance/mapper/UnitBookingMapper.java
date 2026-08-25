package com.livic.finance.mapper;

import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.common.domain.UnitBookingStatus;

import java.util.UUID;

public final class UnitBookingMapper {

    private UnitBookingMapper() {
    }

    public static UnitBookingTbl toEntity(UnitBookingDTOs.CreateBookingRequest request, UUID unitId) {
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
        if (booking == null) {
            return null;
        }
        String resolvedUnitNumber = (unitNumber != null && !unitNumber.trim().isEmpty()) ? unitNumber : "N/A";
        String status = booking.getStatus() != null ? booking.getStatus() : UnitBookingStatus.BOOKED.name();
        String tenantName = booking.getProspectiveTenantName() != null ? booking.getProspectiveTenantName() : "Prospective Tenant";
        String tenantPhone = booking.getProspectiveTenantPhone() != null ? booking.getProspectiveTenantPhone() : "";

        return new UnitBookingDTOs.UnitBookingResponse(
                booking.getId(),
                booking.getUnitId(),
                resolvedUnitNumber,
                booking.getProspectiveTenantUserId(),
                tenantName,
                tenantPhone,
                booking.getProspectiveTenantEmail(),
                booking.getTokenAmount(),
                booking.getExpectedMoveInDate(),
                status,
                booking.getPaymentTransactionId(),
                booking.getConvertedLeaseId(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
