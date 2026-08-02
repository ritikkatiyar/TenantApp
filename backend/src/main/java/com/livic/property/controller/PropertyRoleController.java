package com.livic.property.controller;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.dto.RoleDTOs;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
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
@RequestMapping("/api/v1/property/properties/{propertyId}/roles")
@RequiredArgsConstructor
public class PropertyRoleController {

    private final AuthFacade authFacade;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<RoleDTOs.RoleResponse>>> getPropertyRoles(
            @PathVariable UUID propertyId) {
        return ResponseEntity.ok(ApiResponse.success(authFacade.getPropertyRoles(propertyId)));
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
        MembershipRoleTbl created = authFacade.createCustomRole(propertyId, request, actorId);
        
        RoleDTOs.RoleResponse response = new RoleDTOs.RoleResponse(
                created.getId(),
                created.getCode(),
                created.getName(),
                created.getDescription(),
                created.getRoleRank(),
                created.isActive(),
                request.permissionCodes() != null ? request.permissionCodes() : List.of()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }
}
