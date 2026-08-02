package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.repository.RentCycleRepository;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class RentCycleCrudServiceImpl extends AbstractCrudService<RentCycleTbl, UUID, RentCycleRepository> implements RentCycleCrudService {

    public RentCycleCrudServiceImpl(RentCycleRepository rentCycleRepository) {
        super(rentCycleRepository);
    }

    @Override
    public Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth) {
        return repository.findByLease_IdAndBillingMonth(leaseId, billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByLease_Id(UUID leaseId) {
        return repository.findByLease_Id(leaseId);
    }

    @Override
    public List<RentCycleTbl> findByLease_IdInAndBillingMonth(List<UUID> leaseIds, String billingMonth) {
        return repository.findByLease_IdInAndBillingMonth(leaseIds, billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByBillingMonth(String billingMonth) {
        return repository.findByBillingMonth(billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        return repository.findByLease_Unit_Property_IdAndBillingMonth(propertyId, billingMonth);
    }

    @Override
    public Page<RentCycleTbl> findAll(Specification<RentCycleTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    public List<RentCycleTbl> findAll(Specification<RentCycleTbl> spec) {
        return repository.findAll(spec);
    }
}
