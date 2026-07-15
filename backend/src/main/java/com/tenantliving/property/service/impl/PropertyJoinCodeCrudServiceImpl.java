package com.tenantliving.property.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.property.domain.PropertyJoinCodeTbl;
import com.tenantliving.property.repository.PropertyJoinCodeRepository;
import com.tenantliving.property.service.interfaces.PropertyJoinCodeCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PropertyJoinCodeCrudServiceImpl extends AbstractCrudService<PropertyJoinCodeTbl, UUID, PropertyJoinCodeRepository> implements PropertyJoinCodeCrudService {

    public PropertyJoinCodeCrudServiceImpl(PropertyJoinCodeRepository repository) {
        super(repository);
    }

    @Override
    public Optional<PropertyJoinCodeTbl> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId) {
        return repository.findByPropertyId(propertyId);
    }
}
