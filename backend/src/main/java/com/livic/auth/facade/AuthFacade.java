package com.livic.auth.facade;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.dto.RoleDTOs;

import java.util.List;
import java.util.UUID;

public interface AuthFacade {

    List<MembershipSummaryDTO> getMembershipsByUserId(UUID userId);

    List<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId);

    long countMembershipsByPropertyId(UUID propertyId);

    void createOwnerMembership(UUID propertyId, UUID userId);

    void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId);

    void removeTenantRole(UUID tenantId, UUID propertyId);

    boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId);

    boolean existsByUserIdAndPropertyIdAndRoleCode(UUID userId, UUID propertyId, String roleCode);

    MembershipSummaryDTO assignRole(UUID propertyId, UUID userId, String roleCode, UUID assignedByUserId);

    void removeRole(UUID propertyId, UUID membershipId);

    void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId);

    MembershipRoleTbl getRoleForProperty(String roleCode, UUID propertyId);

    void validateCanDelegateRole(UUID actorId, UUID propertyId, String roleCode, String actorGlobalRole);

    List<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId);

    void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId);

    void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId);

    MembershipRoleTbl createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId);
}
