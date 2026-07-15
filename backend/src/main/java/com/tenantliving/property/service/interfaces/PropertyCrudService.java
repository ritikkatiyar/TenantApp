package com.tenantliving.property.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.property.domain.PropertyTbl;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyCrudService extends CrudService<PropertyTbl, UUID> {
    List<PropertyTbl> findPropertiesByOwnerId(UUID userId);
    List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth);
    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);
}
