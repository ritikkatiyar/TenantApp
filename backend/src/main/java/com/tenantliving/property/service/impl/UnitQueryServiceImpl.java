package com.tenantliving.property.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import com.tenantliving.property.service.interfaces.UnitQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UnitQueryServiceImpl implements UnitQueryService {

    private final UnitRepository unitRepository;
    private final PropertyQueryService propertyQueryService;

    @Override
    public UnitTbl getUnitById(UUID id) {
        return unitRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
    }

    @Override
    public List<UnitDTOs.FloorSummaryResponse> getFloorSummaries(UUID propertyId, Integer throughFloor) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        
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
    public List<UnitTbl> getUnitsByFloor(UUID propertyId, int floorNumber) {
        if (!propertyQueryService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitRepository.findByPropertyIdAndFloor(propertyId, floorNumber);
    }

    @Override
    public List<UnitTbl> getUnitsByProperty(UUID propertyId) {
        if (!propertyQueryService.existsById(propertyId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Property not found");
        }
        return unitRepository.findByPropertyId(propertyId);
    }
}
