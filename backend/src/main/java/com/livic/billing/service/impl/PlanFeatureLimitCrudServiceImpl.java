package com.livic.billing.service.impl;

import com.livic.billing.domain.PlanFeatureLimitTbl;
import com.livic.billing.repository.PlanFeatureLimitRepository;
import com.livic.billing.service.interfaces.PlanFeatureLimitCrudService;
import com.livic.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PlanFeatureLimitCrudServiceImpl extends AbstractCrudService<PlanFeatureLimitTbl, UUID, PlanFeatureLimitRepository> implements PlanFeatureLimitCrudService {

    public PlanFeatureLimitCrudServiceImpl(PlanFeatureLimitRepository repository) {
        super(repository);
    }

    @Override
    public List<PlanFeatureLimitTbl> findByPlanId(String planId) {
        return repository.findByPlanId(planId);
    }

    @Override
    public List<PlanFeatureLimitTbl> findByPlanIdIn(List<String> planIds) {
        return repository.findByPlanIdIn(planIds);
    }

    @Override
    public Optional<PlanFeatureLimitTbl> findByPlanIdAndFeatureKey(String planId, String featureKey) {
        return repository.findByPlanIdAndFeatureKey(planId, featureKey);
    }
}
