package com.tenantliving.finance.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.service.interfaces.ChargeConfigCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ChargeConfigCrudServiceImpl extends AbstractCrudService<ChargeConfigTbl, UUID, ChargeConfigRepository> implements ChargeConfigCrudService {

    public ChargeConfigCrudServiceImpl(ChargeConfigRepository repository) {
        super(repository);
    }

    @Override
    public List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId) {
        return repository.findAllByPropertyIdAndIsActiveTrue(propertyId);
    }

    @Override
    public List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId) {
        return repository.findAllByPropertyId(propertyId);
    }

    @Override
    public Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id) {
        return repository.findByIdAndIsActiveTrue(id);
    }
}
