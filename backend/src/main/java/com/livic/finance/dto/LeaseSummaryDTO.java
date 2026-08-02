package com.livic.finance.dto;

import com.livic.finance.domain.LeaseTbl;

import java.time.LocalDate;
import java.util.UUID;

public record LeaseSummaryDTO(
        UUID id,
        UUID unitId,
        String unitNumber,
        Integer floor,
        UUID propertyId,
        String propertyName,
        UUID userId,
        String status,
        LocalDate moveInDate,
        LocalDate moveOutDate
) {
    public static LeaseSummaryDTO from(LeaseTbl lease) {
        if (lease == null) {
            return null;
        }
        UUID propId = null;
        String propName = null;
        UUID uId = null;
        String uNum = null;
        Integer uFloor = null;

        if (lease.getUnit() != null) {
            uId = lease.getUnit().getId();
            uNum = lease.getUnit().getUnitNumber();
            uFloor = lease.getUnit().getFloor();
            if (lease.getUnit().getProperty() != null) {
                propId = lease.getUnit().getProperty().getId();
                propName = lease.getUnit().getProperty().getName();
            }
        }

        return new LeaseSummaryDTO(
                lease.getId(),
                uId,
                uNum,
                uFloor,
                propId,
                propName,
                lease.getUserId(),
                lease.getStatus() != null ? lease.getStatus().name() : null,
                lease.getMoveInDate(),
                lease.getMoveOutDate()
        );
    }
}
