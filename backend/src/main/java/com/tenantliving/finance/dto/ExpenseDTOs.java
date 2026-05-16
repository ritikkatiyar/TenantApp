package com.tenantliving.finance.dto;

import com.tenantliving.common.domain.ExpenseType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ExpenseDTOs {

    public record CreateExpenseRequest(
            @NotNull UUID expenseGroupId,
            @NotNull UUID createdBy,
            @NotNull @Positive BigDecimal totalAmount,
            @NotNull ExpenseType expenseType,
            String description,
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "billingMonth must use yyyy-MM") String billingMonth
    ) {}

    public record ExpenseResponse(
            UUID id,
            UUID expenseGroupId,
            UUID createdBy,
            BigDecimal totalAmount,
            ExpenseType expenseType,
            String description,
            String billingMonth,
            LocalDateTime createdAt
    ) {}
}
