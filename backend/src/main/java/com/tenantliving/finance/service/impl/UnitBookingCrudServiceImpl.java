package com.tenantliving.finance.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.finance.domain.UnitBookingTbl;
import com.tenantliving.finance.repository.UnitBookingRepository;
import com.tenantliving.finance.service.interfaces.UnitBookingCrudService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
