package com.tenantliving.property.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties")
@RequiredArgsConstructor
    /**
     * Properties
     * Property administration
     */

public class PropertyController {
    private final PropertyService propertyService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        /**
     * Create property
     * Creates a new property for the authenticated user.
     */

    
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> createProperty(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody PropertyDTOs.CreatePropertyRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID creatorId = UUID.fromString(currentUser.getId());
        PropertyTbl createdProperty = propertyService.createProperty(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(createdProperty)));
    }

    @PutMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
        /**
     * Update property
     * Updates an existing property's basic details.
     */

    
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> updateProperty(
            
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl updatedProperty = propertyService.updateProperty(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(toResponse(updatedProperty)));
    }

    @GetMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
        /**
     * Get property
     * Retrieves an existing property's basic details.
     */

    
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> getProperty(
            
            @PathVariable UUID propertyId) {
        PropertyTbl property = propertyService.getPropertyById(propertyId);
        return ResponseEntity.ok(ApiResponse.success(toResponse(property)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
        /**
     * Get my properties
     * Retrieves properties that the authenticated user has access to.
     */
    public ResponseEntity<ApiResponse<java.util.List<PropertyDTOs.PropertyResponse>>> getMyProperties(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        java.util.List<PropertyTbl> properties = propertyService.getPropertiesByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(properties.stream().map(this::toResponse).toList()));
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

    @DeleteMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_DELETE')")
        /**
     * Delete property
     * Deletes an existing property if it has no assigned tenants.
     */

    
    public ResponseEntity<ApiResponse<Void>> deleteProperty(
            
            @PathVariable UUID propertyId) {
        try {
            propertyService.deleteProperty(propertyId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("assigned tenants")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
            }
            throw e;
        }
    }
}
