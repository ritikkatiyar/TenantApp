package com.tenantliving.property.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.service.interfaces.PropertyCrudService;
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
