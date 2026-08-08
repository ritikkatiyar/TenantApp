package com.livic.property.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.property.domain.PropertyTbl;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyCrudService extends CrudService<PropertyTbl, UUID> {
    List<PropertyTbl> findPropertiesByOwnerId(UUID userId);
    List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth);
    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);
    org.springframework.data.domain.Page<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds, org.springframework.data.domain.Pageable pageable);
}
