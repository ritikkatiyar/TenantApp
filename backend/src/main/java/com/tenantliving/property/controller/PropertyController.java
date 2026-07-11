package com.tenantliving.property.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final PropertyQueryService propertyQueryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
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
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> updateProperty(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl updatedProperty = propertyService.updateProperty(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(toResponse(updatedProperty)));
    }

    @GetMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> getProperty(
            @PathVariable UUID propertyId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        return ResponseEntity.ok(ApiResponse.success(toResponse(property)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<List<PropertyDTOs.PropertyResponse>>> getMyProperties(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        List<PropertyTbl> properties = propertyQueryService.getPropertiesByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(properties.stream().map(this::toResponse).toList()));
    }

    @DeleteMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(@PathVariable UUID propertyId) {
        propertyService.deleteProperty(propertyId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{propertyId}/toggle-active")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> togglePropertyActive(
            @PathVariable UUID propertyId,
            @RequestParam boolean active
    ) {
        PropertyTbl updatedProperty = propertyService.togglePropertyActiveStatus(propertyId, active);
        return ResponseEntity.ok(ApiResponse.success(toResponse(updatedProperty)));
    }

    private PropertyDTOs.PropertyResponse toResponse(PropertyTbl property) {
        return new PropertyDTOs.PropertyResponse(
                property.getId(),
                property.getName(),
                property.getAddress(),
                property.getCity(),
                property.getLandmark(),
                property.getTotalFloors(),
                null,
                property.isActive()
        );
    }
}
