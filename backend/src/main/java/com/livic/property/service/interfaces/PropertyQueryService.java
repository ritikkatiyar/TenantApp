package com.livic.property.service.interfaces;

import com.livic.property.domain.PropertyTbl;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PropertyQueryService {
    List<PropertyTbl> getPropertiesByUserId(UUID userId);
    List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds);
    PropertyTbl getPropertyById(UUID propertyId);
    boolean existsById(UUID propertyId);
    List<PropertyTbl> getPropertiesByAutoBillDayOfMonth(int day);
}
