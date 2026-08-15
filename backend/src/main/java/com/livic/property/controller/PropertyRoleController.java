package com.livic.property.controller;

import com.livic.auth.dto.RoleDTOs;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/roles")
@RequiredArgsConstructor
public class PropertyRoleController {

    private final AuthFacade authFacade;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<Page<RoleDTOs.RoleResponse>>> getPropertyRoles(
            @PathVariable UUID propertyId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(authFacade.getPropertyRoles(propertyId, pageable)));
    }

    @PostMapping("/{roleCode}/toggle-active")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> toggleRoleActive(
            @PathVariable UUID propertyId,
            @PathVariable String roleCode,
            @RequestParam boolean active,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID actorId = UUID.fromString(currentUser.getId());
        authFacade.toggleRoleActive(propertyId, roleCode, active, actorId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/{roleCode}/permissions")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> updateRolePermissions(
            @PathVariable UUID propertyId,
            @PathVariable String roleCode,
            @Valid @RequestBody RoleDTOs.UpdateRolePermissionsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID actorId = UUID.fromString(currentUser.getId());
        authFacade.updateRolePermissions(propertyId, roleCode, request.permissionCodes(), actorId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/custom")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<RoleDTOs.RoleResponse>> createCustomRole(
            @PathVariable UUID propertyId,
            @Valid @RequestBody RoleDTOs.CreateCustomRoleRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID actorId = UUID.fromString(currentUser.getId());
        RoleDTOs.RoleResponse response = authFacade.createCustomRole(propertyId, request, actorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }
}
