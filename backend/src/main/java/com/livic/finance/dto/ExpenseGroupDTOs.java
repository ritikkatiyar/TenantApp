package com.livic.finance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public class ExpenseGroupDTOs {

    public record CreateExpenseGroupRequest(
            @NotNull UUID unitId,
            @NotNull UUID createdBy,
            @NotBlank String name
    ) {}

    public record ExpenseGroupResponse(
            UUID id,
            UUID unitId,
            UUID createdBy,
            String name,
            LocalDateTime createdAt
    ) {}
}
