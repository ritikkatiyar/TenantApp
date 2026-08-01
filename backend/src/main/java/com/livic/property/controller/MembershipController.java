package com.livic.property.controller;

import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.dto.MembershipDTOs;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.auth.service.interfaces.MembershipQueryService;
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
import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.FeatureKey;

@RestController
@RequestMapping("/api/v1/property/properties/{propertyId}/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;
    private final MembershipQueryService membershipQueryService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<MembershipDTOs.MembershipResponse>>> listMemberships(
            @PathVariable UUID propertyId) {
            
        List<MembershipDTOs.MembershipResponse> responses = membershipQueryService.getMembershipsByPropertyId(propertyId).stream()
                .map(m -> new MembershipDTOs.MembershipResponse(
                        m.getId(),
                        m.getUser().getId(),
                        m.getUser().getFullName(),
                        m.getUser().getAuthUid(),
                        m.getRole().getCode(),
                        m.getRole().getName()
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
            
        MembershipTbl membership = membershipService.assignRole(
                propertyId, 
                request.userId(), 
                request.roleCode(), 
                UUID.fromString(currentUser.getId())
        );
        
        MembershipDTOs.MembershipResponse response = new MembershipDTOs.MembershipResponse(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getFullName(),
                membership.getUser().getAuthUid(),
                membership.getRole().getCode(),
                membership.getRole().getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId) {
            
        membershipService.removeRole(propertyId, membershipId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/transfer-ownership")
    @PreAuthorize("@authorizationService.hasRole(#propertyId, 'PROPERTY_OWNER')")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MembershipDTOs.TransferOwnershipRequest request) {
            
        UUID currentOwnerId = UUID.fromString(currentUser.getId());
        membershipService.transferOwnership(propertyId, currentOwnerId, request.toUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
