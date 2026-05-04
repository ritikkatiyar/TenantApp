package com.tenantliving.property.controller;

import com.tenantliving.common.exception.ApiError;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@Tag(name = "Properties (admin)", description = "Property administration; requires SUPER_ADMIN or ADMIN")
@SecurityRequirement(name = "bearerAuth")
public class PropertyController {
    private final PropertyService propertyService;

    @PostMapping("/{propertyId}/units/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Generate units in a grid", description = "Creates units per floor/grid for the property. Unit numbers combine optional prefix, floor, and index.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Units persisted"),
            @ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content),
            @ApiResponse(responseCode = "500", description = "Property not found or server error (see logs)",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<Void> batchCreateUnits(
            @Parameter(description = "Property UUID", required = true, in = ParameterIn.PATH, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        propertyService.generateBatchUnits(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
