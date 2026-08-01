package com.livic.billing.service.interfaces;

import com.livic.billing.domain.SaasSubscriptionTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Optional;
import java.util.UUID;

public interface SaasSubscriptionCrudService extends CrudService<SaasSubscriptionTbl, UUID> {
    Optional<SaasSubscriptionTbl> findByUserIdAndStatus(UUID userId, String status);
    Optional<SaasSubscriptionTbl> findLatestByUserId(UUID userId);
    Optional<SaasSubscriptionTbl> findLatestByUserIdAndStatus(UUID userId, String status);
}
