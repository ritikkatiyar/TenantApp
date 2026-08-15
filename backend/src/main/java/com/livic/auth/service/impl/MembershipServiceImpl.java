package com.livic.auth.service.impl;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.MembershipRoleCrudService;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.common.exception.BusinessException;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipCrudService membershipCrudService;
    private final MembershipRoleCrudService membershipRoleCrudService;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId) {
        List<MembershipTbl> existing = membershipCrudService.findByUserIdAndPropertyId(tenantId, propertyId);
        if (existing.stream().anyMatch(m -> "PROPERTY_TENANT".equals(m.getRole().getCode()))) {
            return;
        }

        userFacade.getUserById(tenantId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Tenant user not found"));

        MembershipRoleTbl tenantRole = membershipRoleCrudService.findByCode("PROPERTY_TENANT")
                .orElseThrow(() -> new RuntimeException("PROPERTY_TENANT role not found"));

        MembershipTbl membership = MembershipTbl.builder()
                .userId(tenantId)
                .propertyId(propertyId)
                .role(tenantRole)
                .assignedById(assignedByUserId)
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
        userFacade.getUserById(ownerId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Owner user not found"));
        
        MembershipRoleTbl ownerRole = membershipRoleCrudService.findByCode("PROPERTY_OWNER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PROPERTY_OWNER role not found"));

        MembershipTbl membership = MembershipTbl.builder()
                .userId(ownerId)
                .propertyId(propertyId)
                .role(ownerRole)
                .assignedById(ownerId)
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
        
        userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
        MembershipRoleTbl role = membershipRoleCrudService.findByCode(roleCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        
        MembershipTbl membership = MembershipTbl.builder()
                .userId(userId)
                .propertyId(propertyId)
                .role(role)
                .assignedById(assignedByUserId)
                .build();
                
        return membershipCrudService.save(membership);
    }

    @Override
    @Transactional
    public void removeRole(UUID propertyId, UUID membershipId) {
        MembershipTbl membership = membershipCrudService.findById(membershipId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Membership not found"));
        
        if (!propertyId.equals(membership.getPropertyId())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Membership does not belong to this property");
        }

        if ("PROPERTY_OWNER".equals(membership.getRole().getCode())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot remove the PROPERTY_OWNER role directly. Use ownership transfer.");
        }

        membershipCrudService.delete(membership);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        userFacade.getUserById(toUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Target owner user not found"));

        MembershipRoleTbl ownerRole = membershipRoleCrudService.findByCode("PROPERTY_OWNER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PROPERTY_OWNER role not found"));
        MembershipRoleTbl managerRole = membershipRoleCrudService.findByCode("PROPERTY_MANAGER")
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "PROPERTY_MANAGER role not found"));

        // Demote current owner
        List<MembershipTbl> currentOwnerMemberships = membershipCrudService.findByUserIdAndPropertyId(currentOwnerId, propertyId);
        MembershipTbl currentOwnerMembership = currentOwnerMemberships.stream()
                .filter(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Current user is not the property owner"));

        currentOwnerMembership.setRole(managerRole);
        membershipCrudService.save(currentOwnerMembership);

        // Promote or add new owner
        List<MembershipTbl> toUserMemberships = membershipCrudService.findByUserIdAndPropertyId(toUserId, propertyId);
        Optional<MembershipTbl> toUserOwnerMembership = toUserMemberships.stream()
                .filter(m -> "PROPERTY_OWNER".equals(m.getRole().getCode()))
                .findFirst();

        if (toUserOwnerMembership.isEmpty()) {
            Optional<MembershipTbl> managerOrCaretakerMembership = toUserMemberships.stream()
                    .filter(m -> !m.getRole().getCode().equals("PROPERTY_TENANT"))
                    .findFirst();
                    
            if (managerOrCaretakerMembership.isPresent()) {
                managerOrCaretakerMembership.get().setRole(ownerRole);
                membershipCrudService.save(managerOrCaretakerMembership.get());
            } else {
                MembershipTbl newMembership = MembershipTbl.builder()
                        .userId(toUserId)
                        .propertyId(propertyId)
                        .role(ownerRole)
                        .assignedById(currentOwnerId)
                        .build();
                membershipCrudService.save(newMembership);
            }
        }
    }
}
