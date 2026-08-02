package com.livic.billing.service.impl;

import com.livic.billing.domain.BillingWalletTbl;
import com.livic.billing.repository.BillingWalletRepository;
import com.livic.billing.service.interfaces.BillingWalletCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class BillingWalletCrudServiceImpl
        extends AbstractCrudService<BillingWalletTbl, UUID, BillingWalletRepository>
        implements BillingWalletCrudService {

    public BillingWalletCrudServiceImpl(BillingWalletRepository repository) {
        super(repository);
    }

    @Override
    public Optional<BillingWalletTbl> findByUserId(UUID userId) {
        return repository.findByUserId(userId);
    }

    @Override
    public Optional<BillingWalletTbl> findByUserIdForUpdate(UUID userId) {
        return repository.findByUserIdForUpdate(userId);
    }
}
