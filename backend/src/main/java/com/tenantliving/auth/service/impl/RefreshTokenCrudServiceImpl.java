package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.RefreshTokenTbl;
import com.tenantliving.auth.repository.RefreshTokenRepository;
import com.tenantliving.auth.service.interfaces.RefreshTokenCrudService;
import com.tenantliving.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenCrudServiceImpl extends AbstractCrudService<RefreshTokenTbl, UUID, RefreshTokenRepository> implements RefreshTokenCrudService {

    public RefreshTokenCrudServiceImpl(RefreshTokenRepository repository) {
        super(repository);
    }

    @Override
    public Optional<RefreshTokenTbl> findByTokenHashAndRevokedIsFalse(String tokenHash) {
        return repository.findByTokenHashAndRevokedIsFalse(tokenHash);
    }
}
