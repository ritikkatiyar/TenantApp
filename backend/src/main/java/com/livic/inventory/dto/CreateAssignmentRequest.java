package com.livic.inventory.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateAssignmentRequest(
        @NotNull(message = "Assignment items list is required")
        List<CreateAssignmentItemPayload> items
) {}
