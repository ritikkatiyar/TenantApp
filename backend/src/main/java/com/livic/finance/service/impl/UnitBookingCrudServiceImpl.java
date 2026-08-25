package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.repository.UnitBookingRepository;
import com.livic.finance.service.interfaces.UnitBookingCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class UnitBookingCrudServiceImpl extends AbstractCrudService<UnitBookingTbl, UUID, UnitBookingRepository> implements UnitBookingCrudService {

    private final UnitBookingRepository repository;

    public UnitBookingCrudServiceImpl(UnitBookingRepository repository) {
        super(repository);
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId) {
        return repository.findByStatusAndConvertedLeaseId(status, convertedLeaseId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitBookingTbl> findByUnitIdIn(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return List.of();
        }
        return repository.findByUnitIdIn(unitIds);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitBookingTbl> findByUnitIdIn(Collection<UUID> unitIds, Pageable pageable) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return repository.findByUnitIdIn(unitIds, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitBookingTbl> findByProspectiveTenantUserId(UUID prospectiveTenantUserId) {
        if (prospectiveTenantUserId == null) {
            return List.of();
        }
        return repository.findByProspectiveTenantUserId(prospectiveTenantUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitBookingTbl> findByProspectiveTenantUserId(UUID prospectiveTenantUserId, Pageable pageable) {
        if (prospectiveTenantUserId == null) {
            return Page.empty(pageable);
        }
        return repository.findByProspectiveTenantUserId(prospectiveTenantUserId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UnitBookingTbl> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }
}
