package com.livic.property.facade;

import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.dto.UnitSummaryDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyFacade {

    Optional<PropertySummaryDTO> getPropertyById(UUID propertyId);

    List<PropertySummaryDTO> getPropertiesByUserId(UUID userId);

    List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day);

    Optional<UnitSummaryDTO> getUnitById(UUID unitId);

    List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId);

    List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber);

    boolean isUnitAvailableOnDate(UUID unitId, LocalDate date);

    boolean existsPropertyById(UUID propertyId);

    boolean existsUnitById(UUID unitId);
}
