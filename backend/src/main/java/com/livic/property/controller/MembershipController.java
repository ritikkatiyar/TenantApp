package com.livic.property.controller;

import com.livic.auth.dto.MembershipDTOs;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.FeatureKey;
import com.livic.common.enums.AccessType;
import com.livic.common.response.ApiResponse;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final AuthFacade authFacade;
    private final UserFacade userFacade;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<Page<MembershipDTOs.MembershipResponse>>> listMemberships(
            @PathVariable UUID propertyId,
            @PageableDefault(size = 20) Pageable pageable) {
            
        Page<MembershipSummaryDTO> membershipsPage = authFacade.getMembershipsByPropertyId(propertyId, pageable);
        if (membershipsPage.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(Page.empty(pageable)));
        }

        List<MembershipSummaryDTO> memberships = membershipsPage.getContent();
        List<UUID> userIds = memberships.stream().map(MembershipSummaryDTO::userId).distinct().toList();
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(userIds);

        List<UUID> customAccessMembershipIds = memberships.stream()
                .filter(m -> AccessType.CUSTOM_ACCESS.equals(m.accessType()))
                .map(MembershipSummaryDTO::id)
                .toList();
        Map<UUID, Set<String>> permsMap = authFacade.getPermissionsByMembershipIds(customAccessMembershipIds);

        Page<MembershipDTOs.MembershipResponse> responsePage = membershipsPage.map(m -> {
            UserSummaryDTO user = usersMap.get(m.userId());
            String fullName = user != null ? user.fullName() : "Unknown User";
            String phoneOrEmail = user != null && user.phoneNumber() != null ? user.phoneNumber() : "";
            Set<String> perms = AccessType.FULL_ACCESS.equals(m.accessType())
                    ? Collections.emptySet()
                    : permsMap.getOrDefault(m.id(), Collections.emptySet());
            return new MembershipDTOs.MembershipResponse(
                    m.id(),
                    m.userId(),
                    fullName,
                    phoneOrEmail,
                    m.title(),
                    m.accessType(),
                    m.isActive(),
                    perms
            );
        });
                
        return ResponseEntity.ok(ApiResponse.success(responsePage));
    }

    @PutMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<MembershipDTOs.MembershipResponse>> updateMembership(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MembershipDTOs.UpdateMembershipRequest request) {
            
        MembershipSummaryDTO updated = authFacade.updateMembership(
                propertyId,
                membershipId,
                request.title(),
                request.accessType(),
                request.isActive(),
                request.permissionCodes(),
                UUID.fromString(currentUser.getId())
        );

        UserSummaryDTO user = userFacade.getUserById(updated.userId()).orElse(null);
        String fullName = user != null ? user.fullName() : "Unknown User";
        String email = user != null && user.phoneNumber() != null ? user.phoneNumber() : "";
        Set<String> perms = authFacade.getMembershipPermissions(updated.id());

        MembershipDTOs.MembershipResponse response = new MembershipDTOs.MembershipResponse(
                updated.id(),
                updated.userId(),
                fullName,
                email,
                updated.title(),
                updated.accessType(),
                updated.isActive(),
                perms
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{membershipId}/toggle-active")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> toggleMembershipActive(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam boolean active) {
            
        authFacade.toggleMembershipActive(propertyId, membershipId, active, UUID.fromString(currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<Void>> removeMembership(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
            
        authFacade.removeMembership(propertyId, membershipId, UUID.fromString(currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/transfer-ownership")
    @PreAuthorize("@authorizationService.hasFullAccess(#propertyId)")
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MembershipDTOs.TransferOwnershipRequest request) {
            
        UUID currentOwnerId = UUID.fromString(currentUser.getId());
        authFacade.transferOwnership(propertyId, currentOwnerId, request.toUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
