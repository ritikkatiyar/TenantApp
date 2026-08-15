package com.livic.auth.facade.impl;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.dto.RoleDTOs;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.service.interfaces.AuthService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.MembershipQueryService;
import com.livic.auth.service.interfaces.MembershipRoleCrudService;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.auth.service.interfaces.PropertyRoleService;
import com.livic.auth.service.interfaces.RolePermissionCrudService;
import com.livic.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthFacadeImpl implements AuthFacade {

    private final MembershipQueryService membershipQueryService;
    private final MembershipCrudService membershipCrudService;
    private final MembershipRoleCrudService membershipRoleCrudService;
    private final RolePermissionCrudService rolePermissionCrudService;
    private final MembershipService membershipService;
    private final PropertyRoleService propertyRoleService;
    private final AuthService authService;

    @Override
    public List<MembershipSummaryDTO> getMembershipsByUserId(UUID userId) {
        return membershipQueryService.getMembershipsByUserId(userId).stream()
                .map(MembershipSummaryDTO::from)
                .toList();
    }

    @Override
    public List<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId) {
        return membershipQueryService.getMembershipsByPropertyId(propertyId).stream()
                .map(MembershipSummaryDTO::from)
                .toList();
    }

    @Override
    public long countMembershipsByPropertyId(UUID propertyId) {
        return membershipQueryService.getMembershipsByPropertyId(propertyId).size();
    }

    @Override
    @Transactional
    public void createOwnerMembership(UUID propertyId, UUID userId) {
        membershipService.createOwnerMembership(propertyId, userId);
    }

    @Override
    @Transactional
    public void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId) {
        membershipService.ensureTenantRole(tenantId, propertyId, assignedByUserId);
    }

    @Override
    @Transactional
    public void removeTenantRole(UUID tenantId, UUID propertyId) {
        membershipService.removeTenantRole(tenantId, propertyId);
    }

    @Override
    public boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return membershipQueryService.getMembershipsByUserId(userId).stream()
                .anyMatch(m -> propertyId.equals(m.getPropertyId()));
    }

    @Override
    public boolean existsByUserIdAndPropertyIdAndRoleCode(UUID userId, UUID propertyId, String roleCode) {
        return membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode);
    }

    @Override
    @Transactional
    public MembershipSummaryDTO assignRole(UUID propertyId, UUID userId, String roleCode, UUID assignedByUserId) {
        MembershipTbl membership = membershipService.assignRole(propertyId, userId, roleCode, assignedByUserId);
        return MembershipSummaryDTO.from(membership);
    }

    @Override
    @Transactional
    public void removeRole(UUID propertyId, UUID membershipId) {
        membershipService.removeRole(propertyId, membershipId);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        membershipService.transferOwnership(propertyId, currentOwnerId, toUserId);
    }

    @Override
    public MembershipRoleTbl getRoleForProperty(String roleCode, UUID propertyId) {
        return membershipRoleCrudService.findByCodeAndPropertyId(roleCode, propertyId)
                .or(() -> membershipRoleCrudService.findByCodeAndPropertyIdIsNull(roleCode))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found: " + roleCode));
    }

    @Override
    public RoleDTOs.RoleResponse getRoleResponseForProperty(String roleCode, UUID propertyId) {
        MembershipRoleTbl role = getRoleForProperty(roleCode, propertyId);
        List<String> perms = rolePermissionCrudService.findByRoleId(role.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .toList();
        return new RoleDTOs.RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getRoleRank(),
                role.isActive(),
                perms
        );
    }

    @Override
    public RoleDTOs.RoleResponse getRoleById(UUID roleId) {
        MembershipRoleTbl role = membershipRoleCrudService.findById(roleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        List<String> perms = rolePermissionCrudService.findByRoleId(role.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .toList();
        return new RoleDTOs.RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getRoleRank(),
                role.isActive(),
                perms
        );
    }

    @Override
    @Transactional
    public MembershipSummaryDTO assignRoleById(UUID propertyId, UUID userId, UUID roleId, UUID assignedByUserId) {
        MembershipRoleTbl role = membershipRoleCrudService.findById(roleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found"));
        return assignRole(propertyId, userId, role.getCode(), assignedByUserId);
    }

    @Override
    public void validateCanDelegateRole(UUID actorId, UUID propertyId, String roleCode, String actorGlobalRole) {
        if (!"SUPER_ADMIN".equals(actorGlobalRole != null ? actorGlobalRole : "")) {
            MembershipRoleTbl role = getRoleForProperty(roleCode, propertyId);
            List<String> targetPerms = rolePermissionCrudService.findByRoleId(role.getId()).stream()
                    .map(rp -> rp.getPermission().getCode())
                    .toList();
            Set<String> actorPerms = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(actorId, propertyId);
            if (!actorPerms.containsAll(targetPerms)) {
                throw new BusinessException(HttpStatus.FORBIDDEN,
                        "Cannot invite someone to a role containing permissions you do not possess.");
            }
        }
    }

    @Override
    public List<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId) {
        return propertyRoleService.getPropertyRoles(propertyId);
    }

    @Override
    @Transactional
    public void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId) {
        propertyRoleService.toggleRoleActive(propertyId, roleCode, active, actorId);
    }

    @Override
    @Transactional
    public void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId) {
        propertyRoleService.updateRolePermissions(propertyId, roleCode, permissionCodes, actorId);
    }

    @Override
    @Transactional
    public MembershipRoleTbl createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId) {
        return propertyRoleService.createCustomRole(propertyId, request, actorId);
    }
}
