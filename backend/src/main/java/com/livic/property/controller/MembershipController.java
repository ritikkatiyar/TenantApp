package com.livic.property.controller;

import com.livic.auth.dto.MembershipDTOs;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.FeatureKey;
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
@RequestMapping("/api/v1/property/properties/{propertyId}/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final AuthFacade authFacade;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<MembershipDTOs.MembershipResponse>>> listMemberships(
            @PathVariable UUID propertyId) {
            
        List<MembershipDTOs.MembershipResponse> responses = authFacade.getMembershipsByPropertyId(propertyId).stream()
                .map(m -> new MembershipDTOs.MembershipResponse(
                        m.id(),
                        m.userId(),
                        m.roleName(),
                        "",
                        m.roleCode(),
                        m.roleName()
                )).toList();
                
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    @EnforceSubscription(feature = FeatureKey.MAX_TEAM_MEMBERS)
    public ResponseEntity<ApiResponse<MembershipDTOs.MembershipResponse>> assignRole(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MembershipDTOs.AssignRoleRequest request) {
            
        MembershipSummaryDTO membership = authFacade.assignRole(
                propertyId, 
                request.userId(), 
                request.roleCode(), 
                UUID.fromString(currentUser.getId())
        );
        
        MembershipDTOs.MembershipResponse response = new MembershipDTOs.MembershipResponse(
                membership.id(),
                membership.userId(),
                membership.roleName(),
                "",
                membership.roleCode(),
                membership.roleName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId) {
            
        authFacade.removeRole(propertyId, membershipId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/transfer-ownership")
    @PreAuthorize("@authorizationService.hasRole(#propertyId, 'PROPERTY_OWNER')")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MembershipDTOs.TransferOwnershipRequest request) {
            
        UUID currentOwnerId = UUID.fromString(currentUser.getId());
        authFacade.transferOwnership(propertyId, currentOwnerId, request.toUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
