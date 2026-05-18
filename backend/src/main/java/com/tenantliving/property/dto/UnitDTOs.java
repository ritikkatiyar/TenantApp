package com.tenantliving.property.dto;

import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.common.domain.UnitType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class UnitDTOs {

    @Schema(name = "FloorSummaryResponse", description = "One row for the configure-floors list (unit count and configured state)")
    public record FloorSummaryResponse(
            @Schema(description = "Physical floor index (1 = ground)", example = "4")
            int floorNumber,

            @Schema(description = "Human-readable label", example = "Floor 4")
            String displayLabel,

            @Schema(description = "True when at least one unit exists on this floor")
            boolean configured,

            @Schema(description = "Number of units on this floor", example = "12")
            long unitCount
    ) {}

    @Schema(name = "FloorLayoutUnitRequest", description = "One unit block when saving a floor layout (grid editor)")
    public record FloorLayoutUnitRequest(
            @Schema(example = "402")
            @NotBlank(message = "Unit number is required")
            String unitNumber,

            @Schema(example = "3")
            @NotNull(message = "gridX is required")
            @Min(value = 0, message = "gridX must be non-negative")
            Integer gridX,

            @Schema(example = "2")
            @NotNull(message = "gridY is required")
            @Min(value = 0, message = "gridY must be non-negative")
            Integer gridY,

            @Schema(example = "1")
            @Min(value = 1, message = "gridWidth must be at least 1")
            Integer gridWidth,

            @Schema(example = "1")
            @Min(value = 1, message = "gridHeight must be at least 1")
            Integer gridHeight,

            @Schema(example = "ONE_BHK")
            @NotNull(message = "Unit type is required")
            UnitType type,

            @Schema(example = "2")
            @NotNull(message = "Capacity is required")
            @Min(value = 1, message = "Capacity must be at least 1")
            Integer capacity,

            @Schema(example = "North")
            FacingDirection facing
    ) {}

    @Schema(name = "UnitResponse", description = "Unit persisted state returned after layout save")
    public record UnitResponse(
            UUID id,
            String unitNumber,
            int floor,
            int gridX,
            int gridY,
            int gridWidth,
            int gridHeight,
            UnitType type,
            int capacity,
            FacingDirection facing,
            java.util.List<ActiveLeaseSummary> activeLeases
    ) {}

    public record ActiveLeaseSummary(
            UUID leaseId,
            UUID tenantUserId,
            String tenantName,
            String tenantPhone,
            BigDecimal rentAmount,
            String status
    ) {}
}
