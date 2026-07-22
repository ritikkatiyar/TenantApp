package com.tenantliving.finance.dto;

import com.tenantliving.common.domain.LeaseSplitStrategy;
import com.tenantliving.common.domain.LeaseStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class LeaseDTOs {

    public record CreateLeaseRequest(
            @NotNull UUID userId,
            @NotNull UUID unitId,
            @NotNull @PositiveOrZero BigDecimal securityDeposit,
            @NotNull LeaseSplitStrategy splitStrategy,
            @NotNull LocalDate moveInDate,
            LocalDate moveOutDate,
            LeaseStatus status
    ) {}

    public record LeaseResponse(
            UUID id,
            UUID userId,
            UUID unitId,
            String unitNumber,
            String propertyName,
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
