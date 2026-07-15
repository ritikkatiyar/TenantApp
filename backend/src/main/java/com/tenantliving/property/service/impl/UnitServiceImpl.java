package com.tenantliving.property.service.impl;

import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.property.service.interfaces.UnitCrudService;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.property.service.interfaces.PropertyQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UnitServiceImpl implements UnitService {

    private final UnitCrudService unitCrudService;
    private final PropertyQueryService propertyQueryService;

    @Override
    public List<UnitTbl> saveAll(List<UnitTbl> units) {
        return unitCrudService.saveAll(units);
    }

    @Override
    public List<UnitTbl> saveFloorLayout(
            UUID propertyId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items
    ) {
        if (floorNumber < 1) {
            throw new BusinessException("Floor number must be at least 1");
        }
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);

        Set<String> seenNumbers = new HashSet<>();
        for (UnitDTOs.FloorLayoutUnitRequest item : items) {
            if (!seenNumbers.add(item.unitNumber())) {
                throw new BusinessException("Duplicate unit number in layout: " + item.unitNumber());
            }
        }

        List<UnitTbl> onFloor = unitCrudService.findByPropertyIdAndFloor(propertyId, floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());

        List<UnitTbl> toRemove = onFloor.stream()
                .filter(u -> !incomingNumbers.contains(u.getUnitNumber()))
                .toList();

        // Optimized: batch delete
        unitCrudService.deleteAll(toRemove);

        // Optimized: bulk cache unit numbers to avoid exists queries inside loops
        Set<String> allExistingUnitNumbers = unitCrudService.findByPropertyId(propertyId).stream()
                .map(UnitTbl::getUnitNumber)
                .collect(Collectors.toSet());

        Map<String, UnitTbl> existingOnFloorByNumber = unitCrudService.findByPropertyIdAndFloor(propertyId, floorNumber)
                .stream()
                .collect(Collectors.toMap(UnitTbl::getUnitNumber, u -> u, (a, b) -> a));

        List<UnitTbl> toSave = new ArrayList<>();
        for (UnitDTOs.FloorLayoutUnitRequest item : items) {
            UnitTbl entity = existingOnFloorByNumber.get(item.unitNumber());
            if (entity != null) {
                entity.setGridX(item.gridX());
                entity.setGridY(item.gridY());
                entity.setGridWidth(item.gridWidth() != null ? item.gridWidth() : 1);
                entity.setGridHeight(item.gridHeight() != null ? item.gridHeight() : 1);
                entity.setType(item.type());
                entity.setCapacity(item.capacity());
                entity.setFacing(item.facing() != null ? item.facing() : FacingDirection.UNKNOWN);
                toSave.add(entity);
            } else {
                // Optimized: check in-memory cached Set instead of querying database in loop
                if (allExistingUnitNumbers.contains(item.unitNumber())) {
                    throw new BusinessException(
                            "Unit number \"" + item.unitNumber() + "\" already exists on another floor for this property"
                    );
                }
                FacingDirection facing = item.facing() != null ? item.facing() : FacingDirection.UNKNOWN;
                UnitTbl created = UnitTbl.builder()
                        .property(property)
                        .unitNumber(item.unitNumber())
                        .floor(floorNumber)
                        .gridX(item.gridX())
                        .gridY(item.gridY())
                        .gridWidth(item.gridWidth() != null ? item.gridWidth() : 1)
                        .gridHeight(item.gridHeight() != null ? item.gridHeight() : 1)
                        .type(item.type())
                        .capacity(item.capacity())
                        .facing(facing)
                        .build();
                toSave.add(created);
            }
        }
        // Optimized: batch save
        return unitCrudService.saveAll(toSave);
    }

    @Override
    public List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        List<UnitTbl> generatedUnits = new ArrayList<>();
        for (int currentFloor = request.startingFloorNumber();
             currentFloor < request.startingFloorNumber() + request.totalFloors();
             currentFloor++) {
            for (int unitIndex = 1; unitIndex <= request.unitsPerFloor(); unitIndex++) {
                String prefix = request.prefix() != null ? request.prefix() : "";
                String unitNumber = prefix + currentFloor + String.format("%02d", unitIndex);
                UnitTbl unit = UnitTbl.builder()
                        .property(property)
                        .unitNumber(unitNumber)
                        .floor(currentFloor)
                        .gridY(currentFloor)
                        .gridX(unitIndex)
                        .gridWidth(1)
                        .gridHeight(1)
                        .type(request.unitType())
                        .capacity(request.capacity())
                        .facing(FacingDirection.UNKNOWN)
                        .build();
                generatedUnits.add(unit);
            }
        }
        return saveAll(generatedUnits);
    }
}
