package com.livic.property.facade;

import com.livic.property.dto.PropertySummaryDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyFacade {

    Optional<PropertySummaryDTO> getPropertyById(UUID propertyId);

    org.springframework.data.domain.Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, org.springframework.data.domain.Pageable pageable);

    List<PropertySummaryDTO> getPropertiesByUserId(UUID userId);

    List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day);

    boolean existsPropertyById(UUID propertyId);

    // Analytics Read Methods
    record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName, int totalUnits, int occupiedUnits) {}

    List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds);
}
