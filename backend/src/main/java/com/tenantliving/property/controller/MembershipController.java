package com.tenantliving.property.controller;

import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.repository.MembershipRoleRepository;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties/{propertyId}/memberships")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipRepository membershipRepository;
    private final MembershipRoleRepository membershipRoleRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public record MembershipResponse(
            UUID id,
            UUID userId,
            String fullName,
            String email,
            String roleCode,
            String roleName
    ) {}

    public record AssignRoleRequest(
            @NotNull UUID userId,
            @NotNull String roleCode
    ) {}
    
    public record TransferOwnershipRequest(
            @NotNull UUID toUserId
    ) {}

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<MembershipResponse>>> listMemberships(
            @PathVariable UUID propertyId) {
            
        List<MembershipResponse> responses = membershipRepository.findByPropertyId(propertyId).stream()
                .map(m -> new MembershipResponse(
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
    @Transactional
    public ResponseEntity<ApiResponse<MembershipResponse>> assignRole(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody AssignRoleRequest request) {
            
        if ("PROPERTY_OWNER".equals(request.roleCode())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Use ownership transfer to assign PROPERTY_OWNER"));
        }
        if ("PROPERTY_TENANT".equals(request.roleCode())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tenant roles are assigned automatically via leases"));
        }
        
        if (membershipRepository.existsByUserIdAndPropertyIdAndRoleCode(request.userId(), propertyId, request.roleCode())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("User already has this role on the property"));
        }
        
        UserTbl user = userRepository.findById(request.userId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        MembershipRoleTbl role = membershipRoleRepository.findByCode(request.roleCode())
                .orElseThrow(() -> new RuntimeException("Role not found"));
        UserTbl assigner = userRepository.findById(UUID.fromString(currentUser.getId())).orElse(null);
        
        MembershipTbl membership = MembershipTbl.builder()
                .user(user)
                .property(property)
                .role(role)
                .assignedBy(assigner)
                .build();
                
        membershipRepository.save(membership);
        
        MembershipResponse response = new MembershipResponse(
                membership.getId(),
                user.getId(),
                user.getFullName(),
                user.getAuthUid(),
                role.getCode(),
                role.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{membershipId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeRole(
            @PathVariable UUID propertyId,
            @PathVariable UUID membershipId) {
            
        MembershipTbl membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Membership not found"));
                
        if (!membership.getProperty().getId().equals(propertyId)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Membership does not belong to this property"));
        }
        
        if ("PROPERTY_OWNER".equals(membership.getRole().getCode())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot remove PROPERTY_OWNER membership. Use ownership transfer."));
        }
        
        membershipRepository.delete(membership);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/transfer-ownership")
    @PreAuthorize("@authorizationService.hasRole(#propertyId, 'PROPERTY_OWNER')")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> transferOwnership(
            @PathVariable UUID propertyId,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody TransferOwnershipRequest request) {
            
        UUID currentOwnerId = UUID.fromString(currentUser.getId());
        
        // Find current owner membership
        List<MembershipTbl> currentOwnerMemberships = membershipRepository.findByUserIdAndPropertyId(currentOwnerId, propertyId);
        MembershipTbl currentOwnerMembership = currentOwnerMemberships.stream()
                .filter(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Current user is not the owner"));
                
        UserTbl newOwner = userRepository.findById(request.toUserId())
                .orElseThrow(() -> new RuntimeException("Target user not found"));
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
                
        MembershipRoleTbl ownerRole = membershipRoleRepository.findByCode("PROPERTY_OWNER")
                .orElseThrow(() -> new RuntimeException("Owner role not found"));
        MembershipRoleTbl managerRole = membershipRoleRepository.findByCode("PROPERTY_MANAGER")
                .orElseThrow(() -> new RuntimeException("Manager role not found"));
                
        // Demote current owner to manager
        currentOwnerMembership.setRole(managerRole);
        membershipRepository.save(currentOwnerMembership);
        
        // Check if new owner already has a role
        List<MembershipTbl> targetUserMemberships = membershipRepository.findByUserIdAndPropertyId(request.toUserId(), propertyId);
        boolean targetHasOwner = targetUserMemberships.stream().anyMatch(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()));
        
        if (!targetHasOwner) {
            // Promote or create owner membership for new owner
            Optional<MembershipTbl> managerOrCaretakerMembership = targetUserMemberships.stream()
                    .filter(m -> !m.getRole().getCode().equals("PROPERTY_TENANT"))
                    .findFirst();
                    
            if (managerOrCaretakerMembership.isPresent()) {
                managerOrCaretakerMembership.get().setRole(ownerRole);
                membershipRepository.save(managerOrCaretakerMembership.get());
            } else {
                MembershipTbl newMembership = MembershipTbl.builder()
                        .user(newOwner)
                        .property(property)
                        .role(ownerRole)
                        .assignedBy(userRepository.findById(currentOwnerId).orElse(null))
                        .build();
                membershipRepository.save(newMembership);
            }
        }
        
        // Update property owner_id
        property.setOwner(newOwner);
        propertyRepository.save(property);
        
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
