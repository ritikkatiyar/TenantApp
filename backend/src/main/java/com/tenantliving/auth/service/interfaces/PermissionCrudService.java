package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.PermissionTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionCrudService extends CrudService<PermissionTbl, UUID> {
    Optional<PermissionTbl> findByCode(String code);
    List<PermissionTbl> findByCodeIn(Collection<String> codes);
}
