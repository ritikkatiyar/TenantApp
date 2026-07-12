package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.auth.domain.RolePermissionTbl;
import com.tenantliving.auth.domain.PermissionTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.repository.MembershipRoleRepository;
import com.tenantliving.auth.repository.RolePermissionRepository;
import com.tenantliving.auth.repository.PermissionRepository;
import com.tenantliving.auth.service.interfaces.PropertyRoleService;
import com.tenantliving.auth.dto.RoleDTOs;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.common.domain.UserRole;
import com.tenantliving.common.constant.RoleConstants;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.property.domain.PropertyTbl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service

@RequiredArgsConstructor
@Transactional
public class PropertyRoleServiceImpl implements PropertyRoleService {

    private final MembershipRoleRepository membershipRoleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final MembershipRepository membershipRepository;
    private final UserQueryService userQueryService;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId) {
        List<MembershipRoleTbl> globalRoles = membershipRoleRepository.findByPropertyIdIsNull();
        List<MembershipRoleTbl> propertyRoles = membershipRoleRepository.findByPropertyId(propertyId);

        // Resolve active roles map (property-specific overrides global)
        Map<String, MembershipRoleTbl> rolesMap = new HashMap<>();
        for (MembershipRoleTbl r : globalRoles) {
            rolesMap.put(r.getCode(), r);
        }
        for (MembershipRoleTbl r : propertyRoles) {
            rolesMap.put(r.getCode(), r);
        }

        return rolesMap.values().stream()
                .map(role -> {
                    List<String> perms = rolePermissionRepository.findByRoleId(role.getId()).stream()
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
                })
                .sorted(Comparator.comparingInt(RoleDTOs.RoleResponse::roleRank).reversed())
                .toList();
    }

    @Override
    @Transactional
    public void toggleRoleActive(UUID propertyId, String roleCode, boolean active, UUID actorId) {
        if (RoleConstants.PROPERTY_OWNER.equals(roleCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The Owner role must always be active.");
        }
        if (RoleConstants.PROPERTY_TENANT.equals(roleCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "The Tenant role must always be active.");
        }

        MembershipRoleTbl role = getResolvedRoleForEdit(propertyId, roleCode, actorId);
        role.setActive(active);
        membershipRoleRepository.save(role);
    }

    @Override
    @Transactional
    public void updateRolePermissions(UUID propertyId, String roleCode, List<String> permissionCodes, UUID actorId) {
        if (RoleConstants.PROPERTY_OWNER.equals(roleCode)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Permissions for the Property Owner are immutable.");
        }

        // Validate that actor has all target permissions
        validateActorCanDelegate(propertyId, actorId, permissionCodes);

        MembershipRoleTbl role = getResolvedRoleForEdit(propertyId, roleCode, actorId);

        // Remove existing mappings
        List<RolePermissionTbl> existing = rolePermissionRepository.findByRoleId(role.getId());
        rolePermissionRepository.deleteAll(existing);

        // Save new mappings
        List<PermissionTbl> permissions = permissionRepository.findByCodeIn(permissionCodes);
        List<RolePermissionTbl> newMappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(role)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionRepository.saveAll(newMappings);
    }

    @Override
    @Transactional
    public MembershipRoleTbl createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId) {
        String normalizedName = request.name().trim().replaceAll("[^a-zA-Z0-9\\s]", "").replaceAll("\\s+", "_").toUpperCase();
        if (normalizedName.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Role name cannot contain only special characters.");
        }
        String code = RoleConstants.CUSTOM_ROLE_PREFIX + normalizedName;


        // If duplicate custom role exists on the property
        Optional<MembershipRoleTbl> existing = membershipRoleRepository.findByCodeAndPropertyId(code, propertyId);
        if (existing.isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "A custom role with this code already exists for the property.");
        }

        // Fetch creator's permissions
        Set<String> actorPerms = getActorPermissions(propertyId, actorId);
        List<String> targetPerms = request.permissionCodes();
        if (targetPerms == null || targetPerms.isEmpty()) {
            // Default to creator's full permissions
            targetPerms = new ArrayList<>(actorPerms);
        } else {
            // Validate subset rule
            validateActorCanDelegate(propertyId, actorId, targetPerms);
        }

        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);

        MembershipRoleTbl customRole = MembershipRoleTbl.builder()
                .code(code)
                .name(request.name().trim())
                .description(request.description())
                .property(property)
                .roleRank(30) // Custom role rank
                .isActive(true)
                .build();
        
        MembershipRoleTbl savedRole = membershipRoleRepository.save(customRole);

        // Create mappings
        List<PermissionTbl> permissions = permissionRepository.findByCodeIn(targetPerms);
        List<RolePermissionTbl> mappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(savedRole)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionRepository.saveAll(mappings);

        return savedRole;
    }

    /**
     * Resolves role for editing: clones a global default role if it hasn't been customized yet,
     * or returns the existing property-specific role.
     */
    private MembershipRoleTbl getResolvedRoleForEdit(UUID propertyId, String roleCode, UUID actorId) {
        Optional<MembershipRoleTbl> propSpecific = membershipRoleRepository.findByCodeAndPropertyId(roleCode, propertyId);
        if (propSpecific.isPresent()) {
            return propSpecific.get();
        }

        MembershipRoleTbl globalRole = membershipRoleRepository.findByCodeAndPropertyIdIsNull(roleCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role " + roleCode + " not found."));

        // Validate delegation subset rule against the global role's permissions
        List<String> globalPerms = rolePermissionRepository.findByRoleId(globalRole.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .toList();
        validateActorCanDelegate(propertyId, actorId, globalPerms);

        // Clone global role into a property-specific one
        PropertyTbl property = new PropertyTbl();
        property.setId(propertyId);

        MembershipRoleTbl cloned = MembershipRoleTbl.builder()
                .code(globalRole.getCode())
                .name(globalRole.getName())
                .description(globalRole.getDescription())
                .property(property)
                .roleRank(globalRole.getRoleRank())
                .isActive(true)
                .build();

        MembershipRoleTbl savedCloned = membershipRoleRepository.save(cloned);

        // Clone default permission mappings
        List<PermissionTbl> permissions = permissionRepository.findByCodeIn(globalPerms);
        List<RolePermissionTbl> mappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(savedCloned)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionRepository.saveAll(mappings);

        return savedCloned;
    }

    private void validateActorCanDelegate(UUID propertyId, UUID actorId, Collection<String> targetPermissions) {
        UserTbl actor = userQueryService.getUserById(actorId);
        if (UserRole.SUPER_ADMIN.equals(actor.getGlobalRole())) {
            return; // Super Admin possesses all permissions
        }

        Set<String> actorPerms = getActorPermissions(propertyId, actorId);
        if (!actorPerms.containsAll(targetPermissions)) {
            List<String> missing = targetPermissions.stream()
                    .filter(p -> !actorPerms.contains(p))
                    .toList();
            throw new BusinessException(HttpStatus.FORBIDDEN, 
                    "You cannot assign or delegate permissions you do not possess: " + missing);
        }
    }

    private Set<String> getActorPermissions(UUID propertyId, UUID actorId) {
        return membershipRepository.findPermissionCodesByUserIdAndPropertyId(actorId, propertyId);
    }
}
