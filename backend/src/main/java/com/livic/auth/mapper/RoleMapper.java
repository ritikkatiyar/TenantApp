package com.livic.auth.mapper;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.dto.RoleDTOs;

import java.util.List;

public class RoleMapper {

    private RoleMapper() {
        // Private constructor to prevent instantiation
    }

    public static RoleDTOs.RoleResponse toRoleResponse(MembershipRoleTbl role, List<String> permissions) {
        if (role == null) {
            return null;
        }
        return new RoleDTOs.RoleResponse(
                role.getId(),
                role.getCode(),
                role.getName(),
                role.getDescription(),
                role.getRoleRank(),
                role.isActive(),
                permissions != null ? permissions : List.of()
        );
    }
}
