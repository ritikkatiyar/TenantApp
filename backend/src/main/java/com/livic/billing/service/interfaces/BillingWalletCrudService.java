package com.livic.billing.service.interfaces;

import com.livic.billing.domain.BillingWalletTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface BillingWalletCrudService extends CrudService<BillingWalletTbl, UUID> {
    Optional<BillingWalletTbl> findByUserId(UUID userId);
}
