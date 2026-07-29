package com.livic.auth.service.interfaces;

import com.livic.auth.domain.PermissionTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PermissionCrudService extends CrudService<PermissionTbl, UUID> {
    Optional<PermissionTbl> findByCode(String code);
    List<PermissionTbl> findByCodeIn(Collection<String> codes);
}
