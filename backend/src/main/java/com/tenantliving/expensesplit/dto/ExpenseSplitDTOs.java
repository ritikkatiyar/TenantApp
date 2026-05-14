package com.tenantliving.expensesplit.dto;

import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.common.domain.ExpenseSplitType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ExpenseSplitDTOs {

    public record GenerateExpenseSplitsRequest(
            @NotNull UUID expenseId,
            @NotNull ExpenseSplitType splitType,
            @NotEmpty @Valid List<ParticipantRequest> participants
    ) {}

    public record ParticipantRequest(
            @NotNull UUID userId,
            BigDecimal amount,
            BigDecimal percentage
    ) {}

    public record ExpenseSplitResponse(
            UUID id,
            UUID expenseId,
            UUID userId,
            ExpenseSplitType splitType,
            BigDecimal amount,
            BigDecimal percentage,
            ExpenseSplitStatus status,
            LocalDateTime paidAt,
            LocalDateTime createdAt
    ) {}
}
