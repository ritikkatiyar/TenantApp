package com.livic.property.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.repository.PropertyRepository;
import com.livic.property.service.interfaces.PropertyCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
public class PropertyCrudServiceImpl extends AbstractCrudService<PropertyTbl, UUID, PropertyRepository> implements PropertyCrudService {

    public PropertyCrudServiceImpl(PropertyRepository repository) {
        super(repository);
    }

    @Override
    public List<PropertyTbl> findPropertiesByOwnerId(UUID userId) {
        return repository.findPropertiesByOwnerId(userId);
    }

    @Override
    public List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth) {
        return repository.findByAutoBillDayOfMonth(autoBillDayOfMonth);
    }

    @Override
    public List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds) {
        return repository.findDistinctByIdIn(propertyIds);
    }
}
