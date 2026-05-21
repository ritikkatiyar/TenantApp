package com.tenantliving.property.controller;

import com.tenantliving.common.exception.ApiError;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.service.interfaces.UnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties/{propertyId}")
@RequiredArgsConstructor
@Tag(name = "Units (admin)", description = "Floor summaries and unit layout; requires SUPER_ADMIN or ADMIN")
@SecurityRequirement(name = "bearerAuth")
public class UnitController {

    private final UnitService unitService;
    private final com.tenantliving.property.facade.UnitLayoutFacade unitLayoutFacade;

    @GetMapping("/floors")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "List floors for configuration",
            description = "Returns each floor from the top down with unit counts and configured flag. "
                    + "Pass throughFloor to include empty floors up to that level (e.g. building stories before units exist)."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Floor rows returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Property not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<List<UnitDTOs.FloorSummaryResponse>>> listFloorsForConfiguration(
            @Parameter(description = "Property UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID propertyId,
            @Parameter(description = "Highest floor index to include when there are fewer units (optional)", example = "4")
            @RequestParam(required = false) Integer throughFloor) {
        List<UnitDTOs.FloorSummaryResponse> rows = unitService.getFloorSummaries(propertyId, throughFloor);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    @GetMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Get floor layout",
            description = "Retrieves the saved layout of units for a specific floor."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Layout returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Property not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getFloorLayout(propertyId, floorNumber);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @GetMapping("/floors/layouts")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Get all floors layout",
            description = "Retrieves the saved layout of units for all floors of a property."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Layout returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Property not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getAllFloorsLayout(
            @PathVariable UUID propertyId) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getAllFloorsLayout(propertyId);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @PutMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Save floor layout",
            description = "Creates or updates units on one floor from the layout editor payload. "
                    + "Omitted units are removed unless any lease references them."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Layout saved"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Property not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Cannot drop units that still have leases",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> saveFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber,
            @Valid @RequestBody List<UnitDTOs.FloorLayoutUnitRequest> items) {
        List<UnitDTOs.UnitResponse> saved = unitLayoutFacade.saveFloorLayout(propertyId, floorNumber, items);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PostMapping("/units/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(
            summary = "Generate units in a grid",
            description = "Creates units per floor/grid for the property. Unit numbers combine optional prefix, floor, and index."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Units persisted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Property not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Server error (see logs)",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<Void> batchCreateUnits(
            @Parameter(description = "Property UUID", required = true, in = ParameterIn.PATH, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        unitService.generateBatchUnits(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
