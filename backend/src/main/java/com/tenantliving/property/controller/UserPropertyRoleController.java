package com.tenantliving.property.controller;

import com.tenantliving.common.exception.ApiError;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.UserPropertyRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/roles")
@RequiredArgsConstructor
@Tag(name = "User Property Roles", description = "User-to-property role mappings")
@SecurityRequirement(name = "bearerAuth")
public class UserPropertyRoleController {

    private final UserPropertyRoleService userPropertyRoleService;

    @GetMapping("/users/{userId}/properties")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "List user properties", description = "Returns all properties linked to the selected user.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Properties returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role SUPER_ADMIN or ADMIN", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<List<PropertyDTOs.PropertyResponse>>> getPropertiesByUser(
            @Parameter(description = "User UUID", required = true, in = ParameterIn.PATH, example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
            @PathVariable UUID userId) {
        List<PropertyDTOs.PropertyResponse> properties = userPropertyRoleService.getPropertiesByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(properties));
    }

    private PropertyDTOs.PropertyResponse toResponse(PropertyTbl property) {
        UUID ownerId = property.getOwner() != null ? property.getOwner().getId() : null;
        return new PropertyDTOs.PropertyResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                property.getTotalFloors(),
                ownerId
        );
    }
}
