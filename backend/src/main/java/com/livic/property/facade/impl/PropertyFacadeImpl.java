package com.livic.property.facade.impl;

import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.property.service.interfaces.UnitAvailabilityService;
import com.livic.property.service.interfaces.UnitCrudService;
import com.livic.property.service.interfaces.UnitQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyFacadeImpl implements PropertyFacade {

    private final PropertyQueryService propertyQueryService;
    private final UnitQueryService unitQueryService;
    private final UnitCrudService unitCrudService;
    private final UnitAvailabilityService unitAvailabilityService;

    @Override
    public Optional<PropertySummaryDTO> getPropertyById(UUID propertyId) {
        try {
            return Optional.ofNullable(PropertySummaryDTO.from(propertyQueryService.getPropertyById(propertyId)));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByUserId(UUID userId) {
        return propertyQueryService.getPropertiesByUserId(userId).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyQueryService.getPropertiesByAutoBillDayOfMonth(day).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public Optional<UnitSummaryDTO> getUnitById(UUID unitId) {
        return unitCrudService.findById(unitId)
                .map(UnitSummaryDTO::from);
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId) {
        return unitQueryService.getUnitsByProperty(propertyId).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber) {
        return unitQueryService.getUnitsByFloor(propertyId, floorNumber).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, LocalDate date) {
        return unitAvailabilityService.isUnitAvailableOnDate(unitId, date);
    }

    @Override
    public boolean existsPropertyById(UUID propertyId) {
        return propertyQueryService.existsById(propertyId);
    }

    @Override
    public boolean existsUnitById(UUID unitId) {
        return unitCrudService.existsById(unitId);
    }
}
