package com.livic.property.controller;

import com.livic.common.response.ApiResponse;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyDTOs;
import com.livic.property.mapper.PropertyMapper;
import com.livic.property.service.interfaces.PropertyService;
import com.livic.property.service.interfaces.PropertyQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import java.util.UUID;
import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.FeatureKey;

@RestController
@RequestMapping("/api/v1/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final PropertyQueryService propertyQueryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    @EnforceSubscription(feature = FeatureKey.MAX_PROPERTIES)
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> createProperty(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody PropertyDTOs.CreatePropertyRequest request) {
        UUID creatorId = UUID.fromString(currentUser.getId());
        PropertyTbl createdProperty = propertyService.createProperty(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(PropertyMapper.toResponse(createdProperty)));
    }

    @PutMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> updateProperty(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl updatedProperty = propertyService.updateProperty(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(PropertyMapper.toResponse(updatedProperty)));
    }

    @GetMapping("/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW_OWN_LEASE') or hasAnyRole('TENANT', 'LANDLORD', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ApiResponse<PropertyDTOs.PropertyResponse>> getProperty(
            @PathVariable UUID propertyId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        return ResponseEntity.ok(ApiResponse.success(PropertyMapper.toResponse(property)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<Page<PropertyDTOs.PropertyResponse>>> getMyProperties(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        UUID userId = UUID.fromString(currentUser.getId());
        Page<PropertyTbl> properties = propertyQueryService.getPropertiesByUserId(userId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(properties.map(PropertyMapper::toResponse)));
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
        return ResponseEntity.ok(ApiResponse.success(PropertyMapper.toResponse(updatedProperty)));
    }
}
