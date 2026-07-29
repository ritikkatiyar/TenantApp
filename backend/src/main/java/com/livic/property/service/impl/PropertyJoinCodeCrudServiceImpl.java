package com.livic.property.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.repository.PropertyJoinCodeRepository;
import com.livic.property.service.interfaces.PropertyJoinCodeCrudService;
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
