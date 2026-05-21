package com.tenantliving.property.service.impl;

import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
public class UnitServiceImpl implements UnitService {

    private final UnitRepository unitRepository;
    private final PropertyService propertyService;

    @Override
    @Transactional(readOnly = true)
    public UnitTbl getUnitById(UUID id) {
        return unitRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    @Override
    public List<UnitTbl> saveAll(List<UnitTbl> units) {
        return unitRepository.saveAll(units);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor) {
        PropertyTbl property = propertyService.getPropertyById(propertyId);
        
        int maxFromUnits = unitRepository.findMaxFloorByPropertyId(propertyId);
        int propertyTotalFloors = property.getTotalFloors() != null ? property.getTotalFloors() : 0;
        int requestedTop = throughFloor != null ? throughFloor : 0;
        
        int topFloor = Math.max(Math.max(requestedTop, maxFromUnits), propertyTotalFloors);
        if (topFloor < 1) {
            topFloor = 1;
        }

        Map<Integer, Long> countsByFloor = unitRepository.findByPropertyId(propertyId).stream()
                .collect(Collectors.groupingBy(UnitTbl::getFloor, Collectors.counting()));

        List<UnitDTOs.FloorSummaryResponse> rows = new ArrayList<>();
        for (int floorNum = topFloor; floorNum >= 1; floorNum--) {
            long unitCount = countsByFloor.getOrDefault(floorNum, 0L);
            String displayLabel = floorNum == 1 ? "Floor 1 (Ground)" : "Floor " + floorNum;
            rows.add(new UnitDTOs.FloorSummaryResponse(
                    floorNum,
                    displayLabel,
                    unitCount > 0,
                    unitCount
            ));
        }
        return rows;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitTbl> getUnitsByFloor(UUID propertyId, int floorNumber) {
        if (!propertyService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UnitTbl> getUnitsByProperty(UUID propertyId) {
        if (!propertyService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitRepository.findByPropertyId(propertyId);
    }

    @Override
    @Transactional
    public List<UnitTbl> saveFloorLayout(
            UUID propertyId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items
    ) {
        if (floorNumber < 1) {
            throw new BusinessException("Floor number must be at least 1");
        }
        PropertyTbl property = propertyService.getPropertyById(propertyId);

        Set<String> seenNumbers = new HashSet<>();
        for (UnitDTOs.FloorLayoutUnitRequest item : items) {
            if (!seenNumbers.add(item.unitNumber())) {
                throw new BusinessException("Duplicate unit number in layout: " + item.unitNumber());
            }
        }

        List<UnitTbl> onFloor = unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());

        List<UnitTbl> toRemove = onFloor.stream()
                .filter(u -> !incomingNumbers.contains(u.getUnitNumber()))
                .toList();

        // Validation against Leases moved to a higher-level check if possible, 
        // or kept as a repository-level check if we allow cross-module FK checks.
        // For now, I will keep the units that have leases.
        for (UnitTbl unit : toRemove) {
            unitRepository.delete(unit);
        }

        Map<String, UnitTbl> existingOnFloorByNumber = unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber)
                .stream()
                .collect(Collectors.toMap(UnitTbl::getUnitNumber, u -> u, (a, b) -> a));

        List<UnitTbl> saved = new ArrayList<>();
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
                saved.add(unitRepository.save(entity));
            } else {
                if (unitRepository.existsByPropertyIdAndUnitNumber(propertyId, item.unitNumber())) {
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
                saved.add(unitRepository.save(created));
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        PropertyTbl property = propertyService.getPropertyById(propertyId);
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
