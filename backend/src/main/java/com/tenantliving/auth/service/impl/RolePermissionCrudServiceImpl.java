package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.RolePermissionTbl;
import com.tenantliving.auth.repository.RolePermissionRepository;
import com.tenantliving.auth.service.interfaces.RolePermissionCrudService;
import com.tenantliving.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class RolePermissionCrudServiceImpl extends AbstractCrudService<RolePermissionTbl, UUID, RolePermissionRepository> implements RolePermissionCrudService {

    public RolePermissionCrudServiceImpl(RolePermissionRepository repository) {
        super(repository);
    }

    @Override
    public List<RolePermissionTbl> findByRoleId(UUID roleId) {
        return repository.findByRoleId(roleId);
    }

    @Override
    public List<RolePermissionTbl> findByRoleIdIn(Collection<UUID> roleIds) {
        return repository.findByRoleIdIn(roleIds);
    }
}
