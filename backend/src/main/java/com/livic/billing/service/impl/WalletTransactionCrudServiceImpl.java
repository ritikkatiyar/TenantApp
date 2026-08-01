package com.livic.billing.service.impl;

import com.livic.billing.domain.WalletTransactionTbl;
import com.livic.billing.repository.WalletTransactionRepository;
import com.livic.billing.service.interfaces.WalletTransactionCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class WalletTransactionCrudServiceImpl
        extends AbstractCrudService<WalletTransactionTbl, UUID, WalletTransactionRepository>
        implements WalletTransactionCrudService {

    public WalletTransactionCrudServiceImpl(WalletTransactionRepository repository) {
        super(repository);
    }

    @Override
    public List<WalletTransactionTbl> findByWalletIdOrderByCreatedAtDesc(UUID walletId) {
        return repository.findByWalletIdOrderByCreatedAtDesc(walletId);
    }

    @Override
    public boolean existsByWalletIdAndReferenceId(UUID walletId, String referenceId) {
        return repository.existsByWalletIdAndReferenceId(walletId, referenceId);
    }
}
