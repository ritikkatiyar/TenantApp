package com.livic.property.facade.impl;

import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.UnitFacade;
import com.livic.property.service.interfaces.UnitCrudService;
import com.livic.property.service.interfaces.UnitQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitFacadeImpl implements UnitFacade {

    private final UnitQueryService unitQueryService;
    private final UnitCrudService unitCrudService;

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
    public boolean existsUnitById(UUID unitId) {
        return unitCrudService.existsById(unitId);
    }

    @Override
    public long getTotalUnitsForPropertyIds(List<UUID> propertyIds) {
        return unitCrudService.countByPropertyIdIn(propertyIds);
    }
}
