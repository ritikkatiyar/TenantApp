package com.tenantliving.unit.service.impl;

import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.lease.repository.LeaseRepository;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.unit.domain.UnitTbl;
import com.tenantliving.unit.dto.UnitDTOs;
import com.tenantliving.unit.repository.UnitRepository;
import com.tenantliving.unit.service.interfaces.UnitService;
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
    private final PropertyRepository propertyRepository;
    private final LeaseRepository leaseRepository;

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
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        
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
    public List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, int floorNumber) {
        if (!propertyRepository.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber)
                .stream()
                .map(UnitServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<UnitDTOs.UnitResponse> saveFloorLayout(
            UUID propertyId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items
    ) {
        if (floorNumber < 1) {
            throw new BusinessException("Floor number must be at least 1");
        }
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));

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

        for (UnitTbl unit : toRemove) {
            if (leaseRepository.existsByUnit_Id(unit.getId())) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "Cannot remove unit " + unit.getUnitNumber() + " from the layout while leases reference it"
                );
            }
            unitRepository.delete(unit);
        }

        Map<String, UnitTbl> existingOnFloorByNumber = unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber)
                .stream()
                .collect(Collectors.toMap(UnitTbl::getUnitNumber, u -> u, (a, b) -> a));

        List<UnitDTOs.UnitResponse> saved = new ArrayList<>();
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
                saved.add(toResponse(unitRepository.save(entity)));
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
                saved.add(toResponse(unitRepository.save(created)));
            }
        }
        return saved;
    }

    @Override
    @Transactional
    public List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
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

    private static UnitDTOs.UnitResponse toResponse(UnitTbl u) {
        return new UnitDTOs.UnitResponse(
                u.getId(),
                u.getUnitNumber(),
                u.getFloor(),
                u.getGridX(),
                u.getGridY(),
                u.getGridWidth(),
                u.getGridHeight(),
                u.getType(),
                u.getCapacity(),
                u.getFacing()
        );
    }
}
