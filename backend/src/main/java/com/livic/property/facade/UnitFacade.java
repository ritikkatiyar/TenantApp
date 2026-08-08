package com.livic.property.facade;

import com.livic.property.dto.UnitSummaryDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnitFacade {

    Optional<UnitSummaryDTO> getUnitById(UUID unitId);

    List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId);

    List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber);

    boolean isUnitAvailableOnDate(UUID unitId, LocalDate date);

    boolean existsUnitById(UUID unitId);

    long getTotalUnitsForPropertyIds(List<UUID> propertyIds);
}
