package com.livic.auth.service.impl;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.domain.RolePermissionTbl;
import com.livic.auth.domain.PermissionTbl;
import com.livic.auth.service.interfaces.MembershipRoleCrudService;
import com.livic.auth.service.interfaces.RolePermissionCrudService;
import com.livic.auth.service.interfaces.PermissionCrudService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.PropertyRoleService;
import com.livic.auth.dto.RoleDTOs;
import com.livic.common.exception.BusinessException;
import com.livic.common.domain.UserRole;
import com.livic.common.constant.RoleConstants;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;

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

    private final MembershipRoleCrudService membershipRoleCrudService;
    private final RolePermissionCrudService rolePermissionCrudService;
    private final PermissionCrudService permissionCrudService;
    private final MembershipCrudService membershipCrudService;
    private final UserFacade userFacade;

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTOs.RoleResponse> getPropertyRoles(UUID propertyId) {
        List<MembershipRoleTbl> globalRoles = membershipRoleCrudService.findByPropertyIdIsNull();
        List<MembershipRoleTbl> propertyRoles = membershipRoleCrudService.findByPropertyId(propertyId);

        // Resolve active roles map (property-specific overrides global)
        Map<String, MembershipRoleTbl> rolesMap = new HashMap<>();
        for (MembershipRoleTbl r : globalRoles) {
            rolesMap.put(r.getCode(), r);
        }
        for (MembershipRoleTbl r : propertyRoles) {
            rolesMap.put(r.getCode(), r);
        }

        List<UUID> roleIds = rolesMap.values().stream().map(MembershipRoleTbl::getId).toList();
        Map<UUID, List<String>> rolePermissionsMap = new HashMap<>();
        if (!roleIds.isEmpty()) {
            rolePermissionsMap = rolePermissionCrudService.findByRoleIdIn(roleIds).stream()
                    .collect(Collectors.groupingBy(
                            rp -> rp.getRole().getId(),
                            Collectors.mapping(rp -> rp.getPermission().getCode(), Collectors.toList())
                    ));
        }

        final Map<UUID, List<String>> finalRolePermissionsMap = rolePermissionsMap;

        return rolesMap.values().stream()
                .map(role -> {
                    List<String> perms = finalRolePermissionsMap.getOrDefault(role.getId(), List.of());
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
        membershipRoleCrudService.save(role);
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
        List<RolePermissionTbl> existing = rolePermissionCrudService.findByRoleId(role.getId());
        rolePermissionCrudService.deleteAll(existing);

        // Save new mappings
        List<PermissionTbl> permissions = permissionCrudService.findByCodeIn(permissionCodes);
        List<RolePermissionTbl> newMappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(role)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionCrudService.saveAll(newMappings);
    }

    @Override
    @Transactional
    public RoleDTOs.RoleResponse createCustomRole(UUID propertyId, RoleDTOs.CreateCustomRoleRequest request, UUID actorId) {
        String normalizedName = request.name().trim().replaceAll("[^a-zA-Z0-9\\s]", "").replaceAll("\\s+", "_").toUpperCase();
        if (normalizedName.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Role name cannot contain only special characters.");
        }
        String code = RoleConstants.CUSTOM_ROLE_PREFIX + normalizedName;


        // If duplicate custom role exists on the property
        Optional<MembershipRoleTbl> existing = membershipRoleCrudService.findByCodeAndPropertyId(code, propertyId);
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

        MembershipRoleTbl customRole = MembershipRoleTbl.builder()
                .code(code)
                .name(request.name().trim())
                .description(request.description())
                .propertyId(propertyId)
                .roleRank(30) // Custom role rank
                .isActive(true)
                .build();
        
        MembershipRoleTbl savedRole = membershipRoleCrudService.save(customRole);

        // Create mappings
        List<PermissionTbl> permissions = permissionCrudService.findByCodeIn(targetPerms);
        List<RolePermissionTbl> mappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(savedRole)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionCrudService.saveAll(mappings);

        return com.livic.auth.mapper.RoleMapper.toRoleResponse(savedRole, targetPerms);
    }

    /**
     * Resolves role for editing: clones a global default role if it hasn't been customized yet,
     * or returns the existing property-specific role.
     */
    private MembershipRoleTbl getResolvedRoleForEdit(UUID propertyId, String roleCode, UUID actorId) {
        Optional<MembershipRoleTbl> propSpecific = membershipRoleCrudService.findByCodeAndPropertyId(roleCode, propertyId);
        if (propSpecific.isPresent()) {
            return propSpecific.get();
        }

        MembershipRoleTbl globalRole = membershipRoleCrudService.findByCodeAndPropertyIdIsNull(roleCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role " + roleCode + " not found."));

        // Validate delegation subset rule against the global role's permissions
        List<String> globalPerms = rolePermissionCrudService.findByRoleId(globalRole.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .toList();
        validateActorCanDelegate(propertyId, actorId, globalPerms);

        MembershipRoleTbl cloned = MembershipRoleTbl.builder()
                .code(globalRole.getCode())
                .name(globalRole.getName())
                .description(globalRole.getDescription())
                .propertyId(propertyId)
                .roleRank(globalRole.getRoleRank())
                .isActive(true)
                .build();

        MembershipRoleTbl savedCloned = membershipRoleCrudService.save(cloned);

        // Clone default permission mappings
        List<PermissionTbl> permissions = permissionCrudService.findByCodeIn(globalPerms);
        List<RolePermissionTbl> mappings = permissions.stream()
                .map(p -> RolePermissionTbl.builder()
                        .role(savedCloned)
                        .permission(p)
                        .build())
                .toList();
        rolePermissionCrudService.saveAll(mappings);

        return savedCloned;
    }

    private void validateActorCanDelegate(UUID propertyId, UUID actorId, Collection<String> targetPermissions) {
        UserSummaryDTO actor = userFacade.getUserById(actorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Actor user not found"));
        if ("SUPER_ADMIN".equals(actor.globalRole() != null ? actor.globalRole() : "")) {
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
        return membershipCrudService.findPermissionCodesByUserIdAndPropertyId(actorId, propertyId);
    }
}
