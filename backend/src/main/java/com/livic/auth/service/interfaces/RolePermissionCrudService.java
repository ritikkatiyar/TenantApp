package com.livic.auth.service.interfaces;

import com.livic.auth.domain.RolePermissionTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RolePermissionCrudService extends CrudService<RolePermissionTbl, UUID> {
    List<RolePermissionTbl> findByRoleId(UUID roleId);
    List<RolePermissionTbl> findByRoleIdIn(Collection<UUID> roleIds);
}
