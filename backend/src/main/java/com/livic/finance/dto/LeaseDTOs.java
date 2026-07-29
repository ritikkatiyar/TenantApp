package com.livic.finance.dto;

import com.livic.common.domain.LeaseSplitStrategy;
import com.livic.common.domain.LeaseStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class LeaseDTOs {

    public record CreateLeaseRequest(
            UUID userId,
            @NotNull UUID unitId,
            @NotNull @PositiveOrZero BigDecimal securityDeposit,
            @NotNull LeaseSplitStrategy splitStrategy,
            @NotNull LocalDate moveInDate,
            LocalDate moveOutDate,
            LeaseStatus status,
            UUID bookingId
    ) {}

    public record LeaseResponse(
            UUID id,
            UUID userId,
            UUID unitId,
            String unitNumber,
            String propertyName,
            String tenantName,
            String tenantPhone,
            BigDecimal rentAmount,
            BigDecimal securityDeposit,
            LeaseSplitStrategy splitStrategy,
            LocalDate moveInDate,
            LocalDate moveOutDate,
            LeaseStatus status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}
}
