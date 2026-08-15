package com.livic.auth.facade;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.dto.RoleDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    RoleDTOs.RoleResponse getRoleResponseForProperty(String roleCode, UUID propertyId);

    RoleDTOs.RoleResponse getRoleById(UUID roleId);

    MembershipSummaryDTO assignRoleById(UUID propertyId, UUID userId, UUID roleId, UUID assignedByUserId);

    void validateCanDelegateRole(UUID actorId, UUID propertyId, String roleCode, String actorGlobalRole);

    Page<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId, Pageable pageable);

    void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId);

    void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId);

    RoleDTOs.RoleResponse createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId);
}
