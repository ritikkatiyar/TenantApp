package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.RolePermissionTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RolePermissionCrudService extends CrudService<RolePermissionTbl, UUID> {
    List<RolePermissionTbl> findByRoleId(UUID roleId);
    List<RolePermissionTbl> findByRoleIdIn(Collection<UUID> roleIds);
}
