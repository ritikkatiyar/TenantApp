package com.livic.auth.service.impl;

import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.service.interfaces.MembershipRoleCrudService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.property.domain.PropertyTbl;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import com.livic.common.exception.BusinessException;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MembershipServiceImpl implements MembershipService {

    private final MembershipCrudService membershipCrudService;
    private final MembershipRoleCrudService membershipRoleCrudService;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId) {
        if (membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(tenantId, propertyId, "PROPERTY_TENANT")) {
            return; // Already has tenant role here
        }

        UserSummaryDTO tenantSummary = userFacade.getUserById(tenantId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tenant user not found"));
        UserTbl tenant = new UserTbl();
        tenant.setId(tenantSummary.id());
        
        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);
        UserTbl assigner = null;
        if (assignedByUserId != null) {
            assigner = new UserTbl();
            assigner.setId(assignedByUserId);
        }
        
        MembershipRoleTbl tenantRole = membershipRoleCrudService.findByCode("PROPERTY_TENANT")
                .orElseThrow(() -> new RuntimeException("PROPERTY_TENANT role not found"));

        MembershipTbl membership = MembershipTbl.builder()
                .user(tenant)
                .property(property)
                .role(tenantRole)
                .assignedBy(assigner)
                .build();
        
        membershipCrudService.save(membership);
    }

    private void removeOtherTenantMemberships(List<MembershipTbl> memberships) {
        List<MembershipTbl> tenantsToRemove = memberships.stream()
                .filter(m -> "PROPERTY_TENANT".equals(m.getRole().getCode()))
                .toList();
        if (!tenantsToRemove.isEmpty()) {
            membershipCrudService.deleteAll(tenantsToRemove);
        }
    }

    @Override
    @Transactional
    public void removeTenantRole(UUID tenantId, UUID propertyId) {
        List<MembershipTbl> memberships = membershipCrudService.findByUserIdAndPropertyId(tenantId, propertyId);
        removeOtherTenantMemberships(memberships);
    }

    @Override
    @Transactional
    public void createOwnerMembership(UUID propertyId, UUID ownerId) {
        UserSummaryDTO ownerSummary = userFacade.getUserById(ownerId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner user not found"));
        UserTbl owner = new UserTbl();
        owner.setId(ownerSummary.id());
        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);
        
        MembershipRoleTbl ownerRole = membershipRoleCrudService.findByCode("PROPERTY_OWNER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PROPERTY_OWNER role not found"));

        MembershipTbl membership = MembershipTbl.builder()
                .user(owner)
                .property(property)
                .role(ownerRole)
                .assignedBy(owner)
                .build();
        
        membershipCrudService.save(membership);
    }

    @Override
    @Transactional
    public MembershipTbl assignRole(UUID propertyId, UUID userId, String roleCode, UUID assignedByUserId) {
        if ("PROPERTY_OWNER".equals(roleCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Use ownership transfer to assign PROPERTY_OWNER");
        }
        if ("PROPERTY_TENANT".equals(roleCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Tenant roles are assigned automatically via leases");
        }
        
        if (membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode)) {
            throw new BusinessException(HttpStatus.CONFLICT, "User already has this role on the property");
        }
        
        UserSummaryDTO userSummary = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
        UserTbl user = new UserTbl();
        user.setId(userSummary.id());
        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);
        MembershipRoleTbl role = membershipRoleCrudService.findByCode(roleCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        UserTbl assigner = null;
        if (assignedByUserId != null) {
            assigner = new UserTbl();
            assigner.setId(assignedByUserId);
        }
        
        MembershipTbl membership = MembershipTbl.builder()
                .user(user)
                .property(property)
                .role(role)
                .assignedBy(assigner)
                .build();
                
        return membershipCrudService.save(membership);
    }

    @Override
    @Transactional
    public void removeRole(UUID propertyId, UUID membershipId) {
        MembershipTbl membership = membershipCrudService.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));
                
        if (!membership.getProperty().getId().equals(propertyId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }
        
        if ("PROPERTY_OWNER".equals(membership.getRole().getCode())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot remove PROPERTY_OWNER membership. Use ownership transfer.");
        }
        
        membershipCrudService.delete(membership);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        List<MembershipTbl> currentOwnerMemberships = membershipCrudService.findByUserIdAndPropertyId(currentOwnerId, propertyId);
        MembershipTbl currentOwnerMembership = currentOwnerMemberships.stream()
                .filter(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(HttpStatus.FORBIDDEN, "Current user is not the owner"));
                
        UserSummaryDTO newOwnerSummary = userFacade.getUserById(toUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "New owner user not found"));
        UserTbl newOwner = new UserTbl();
        newOwner.setId(newOwnerSummary.id());
        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);
        MembershipRoleTbl ownerRole = membershipRoleCrudService.findByCode("PROPERTY_OWNER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner role not found"));
        MembershipRoleTbl managerRole = membershipRoleCrudService.findByCode("PROPERTY_MANAGER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Manager role not found"));
                
        // Demote current owner to manager
        currentOwnerMembership.setRole(managerRole);
        membershipCrudService.save(currentOwnerMembership);
        
        // Check if new owner already has a role
        List<MembershipTbl> targetUserMemberships = membershipCrudService.findByUserIdAndPropertyId(toUserId, propertyId);
        boolean targetHasOwner = targetUserMemberships.stream().anyMatch(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()));
        
        if (!targetHasOwner) {
            // Promote or create owner membership for new owner
            java.util.Optional<MembershipTbl> managerOrCaretakerMembership = targetUserMemberships.stream()
                    .filter(m -> !m.getRole().getCode().equals("PROPERTY_TENANT"))
                    .findFirst();
                    
            if (managerOrCaretakerMembership.isPresent()) {
                managerOrCaretakerMembership.get().setRole(ownerRole);
                membershipCrudService.save(managerOrCaretakerMembership.get());
            } else {
                UserTbl assignerRef = new UserTbl();
                assignerRef.setId(currentOwnerId);
                MembershipTbl newMembership = MembershipTbl.builder()
                        .user(newOwner)
                        .property(property)
                        .role(ownerRole)
                        .assignedBy(assignerRef)
                        .build();
                membershipCrudService.save(newMembership);
            }
        }
    }
}
