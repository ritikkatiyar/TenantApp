package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.repository.UnitBookingRepository;
import com.livic.finance.service.interfaces.UnitBookingCrudService;
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
