package com.tenantliving.property.dto;

import com.tenantliving.common.domain.UnitType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PropertyDTOs {

    @Schema(name = "CreatePropertyRequest", description = "Future: create property (endpoint not yet exposed)")
    public record CreatePropertyRequest(
            @Schema(example = "Sunrise PG")
            @NotBlank(message = "Property name is required")
            String name,

            @Schema(example = "12 MG Road, Bengaluru")
            @NotBlank(message = "Address is required")
            String address,

            @Schema(example = "Bengaluru")
            @NotBlank(message = "City is required")
            String city,

            @Schema(example = "Near metro")
            String landmark,

            @Schema(example = "5")
            Integer totalFloors
    ) {}

    @Schema(name = "UpdatePropertyRequest", description = "Request payload to update an existing property")
    public record UpdatePropertyRequest(
            @Schema(example = "Sunrise PG")
            @NotBlank(message = "Property name is required")
            String name,

            @Schema(example = "12 MG Road, Bengaluru")
            @NotBlank(message = "Address is required")
            String address,

            @Schema(example = "Bengaluru")
            @NotBlank(message = "City is required")
            String city,

            @Schema(example = "Near metro")
            String landmark,

            @Schema(example = "5")
            Integer totalFloors
    ) {}

    @Schema(name = "PropertyResponse", description = "Property details")
    public record PropertyResponse(
            UUID id,
            String name,
            String address,
            String city,
            String landmark,
            Integer totalFloors,
            UUID ownerId
    ) {}

    @Schema(name = "BatchUnitRequest", description = "Grid of units: floors × units per floor; Unit numbers derived from prefix, floor, and index")
    public record BatchUnitRequest(
            @Schema(description = "Number of consecutive floors to fill", example = "3")
            @Min(value = 1, message = "Must have at least 1 floor")
            int totalFloors,

            @Schema(description = "Units generated on each floor", example = "4")
            @Min(value = 1, message = "Must have at least 1 Unit per floor")
            int unitsPerFloor,

            @Schema(description = "First floor number (e.g. 1 or G as integer)", example = "1")
            int startingFloorNumber,

            @Schema(description = "Optional prefix for unitNumber", example = "A")
            String prefix,

            @Schema(description = "Capacity for each unit", example = "1")
            @Min(value = 1, message = "Must have at least 1 occupant capacity")
            int capacity,

            @Schema(description = "Unit type; JSON may use enum name or displayName", example = "SINGLE_UNIT")
            @NotNull(message = "Unit type is required")
            UnitType unitType
    ) {}
}
