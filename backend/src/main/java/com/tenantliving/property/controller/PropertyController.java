package com.tenantliving.property.controller;

import com.tenantliving.common.exception.ApiError;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
@Tag(name = "Properties (admin)", description = "Property administration; requires SUPER_ADMIN or ADMIN")
@SecurityRequirement(name = "bearerAuth")
public class PropertyController {
    private final PropertyService propertyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Create property", description = "Creates a new property for the provided owner.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Property created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content)
    })
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> createProperty(
            @Parameter(description = "Owner UUID", required = true, in = ParameterIn.QUERY, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @RequestParam UUID ownerId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody PropertyDTOs.CreatePropertyRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID creatorId = UUID.fromString(currentUser.getId());
        PropertyTbl createdProperty = propertyService.createProperty(request, ownerId, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(createdProperty)));
    }

    @PutMapping("/{propertyId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Update property", description = "Updates an existing property's basic details.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Property updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Property not found or server error (see logs)",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> updateProperty(
            @Parameter(description = "Property UUID", required = true, in = ParameterIn.PATH, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl updatedProperty = propertyService.updateProperty(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(toResponse(updatedProperty)));
    }

    @PostMapping("/{propertyId}/units/batch")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Generate units in a grid", description = "Creates units per floor/grid for the property. Unit numbers combine optional prefix, floor, and index.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Units persisted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Property not found or server error (see logs)",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<Void> batchCreateUnits(
            @Parameter(description = "Property UUID", required = true, in = ParameterIn.PATH, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        propertyService.generateBatchUnits(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private PropertyDTOs.PropertyResponse toResponse(PropertyTbl property) {
        UUID ownerId = property.getOwner() != null ? property.getOwner().getId() : null;
        return new PropertyDTOs.PropertyResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                ownerId
        );
    }
}
