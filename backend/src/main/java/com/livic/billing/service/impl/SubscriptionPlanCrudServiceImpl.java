package com.livic.billing.service.impl;

import com.livic.billing.domain.SubscriptionPlanTbl;
import com.livic.billing.repository.SubscriptionPlanRepository;
import com.livic.billing.service.interfaces.SubscriptionPlanCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SubscriptionPlanCrudServiceImpl
        extends AbstractCrudService<SubscriptionPlanTbl, UUID, SubscriptionPlanRepository>
        implements SubscriptionPlanCrudService {

    public SubscriptionPlanCrudServiceImpl(SubscriptionPlanRepository repository) {
        super(repository);
    }

    @Override
    public Optional<SubscriptionPlanTbl> findByPlanKey(String planKey) {
        return repository.findByPlanKey(planKey);
    }

    @Override
    public List<SubscriptionPlanTbl> findByIsActiveTrue() {
        return repository.findByIsActiveTrue();
    }
}
