package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.domain.RefreshTokenTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenCrudService extends CrudService<RefreshTokenTbl, UUID> {
    Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash);
}
