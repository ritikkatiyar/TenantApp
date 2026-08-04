package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.repository.LeaseRepository;
import com.livic.finance.service.interfaces.LeaseCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class LeaseCrudServiceImpl extends AbstractCrudService<LeaseTbl, UUID, LeaseRepository> implements LeaseCrudService {

    public LeaseCrudServiceImpl(LeaseRepository leaseRepository) {
        super(leaseRepository);
    }

    @Override
    public Optional<LeaseTbl> findWithUnitAndPropertyById(UUID id) {
        return repository.findWithUnitAndPropertyById(id);
    }

    @Override
    public Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status) {
        return repository.findByUserIdAndStatus(userId, status);
    }

    @Override
    public List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status) {
        return repository.findByUnitIdAndStatus(unitId, status);
    }

    @Override
    public List<LeaseTbl> findActiveOccupanciesByProperty(UUID propertyId, LeaseStatus status) {
        return repository.findActiveOccupanciesByProperty(propertyId, status);
    }

    @Override
    public boolean existsByUnit_Id(UUID unitId) {
        return repository.existsByUnit_Id(unitId);
    }

    @Override
    public List<LeaseTbl> findByUnit_IdInAndStatus(Collection<UUID> unitIds, LeaseStatus status) {
        return repository.findByUnit_IdInAndStatus(unitIds, status);
    }

    @Override
    public boolean existsByUserIdAndPropertyIdAndStatus(UUID userId, UUID propertyId, LeaseStatus status) {
        return repository.existsByUserIdAndPropertyIdAndStatus(userId, propertyId, status);
    }

    @Override
    public boolean existsByUnit_Property_Id(UUID propertyId) {
        return repository.existsByUnit_Property_Id(propertyId);
    }
}
