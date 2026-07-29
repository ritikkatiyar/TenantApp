package com.livic.auth.repository;

import com.livic.auth.domain.RolePermissionTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermissionTbl, UUID> {
    List<RolePermissionTbl> findByRoleId(UUID roleId);
    List<RolePermissionTbl> findByRoleIdIn(java.util.Collection<UUID> roleIds);
}
