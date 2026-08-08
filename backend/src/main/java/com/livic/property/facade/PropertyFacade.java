package com.livic.property.facade;

import com.livic.property.dto.PropertySummaryDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyFacade {

    Optional<PropertySummaryDTO> getPropertyById(UUID propertyId);

    Page<PropertySummaryDTO> getPropertiesByUserId(UUID userId, Pageable pageable);

    List<PropertySummaryDTO> getPropertiesByUserId(UUID userId);

    List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day);

    boolean existsPropertyById(UUID propertyId);

    // Analytics Read Methods
    record PropertyOccupancySummaryDTO(UUID propertyId, String propertyName, int totalUnits, int occupiedUnits) {}

    List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds);
}
