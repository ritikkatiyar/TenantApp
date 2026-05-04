package com.tenantliving.property.service.impl;

import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.unit.domain.UnitTbl;
import com.tenantliving.unit.service.interfaces.UnitService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.property.service.interfaces.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {
    private final PropertyRepository propertyRepository;
    private final UnitService unitService;
    private final UserService userService;

    @Override
    @Transactional
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID ownerId) {
        UserTbl owner = userService.getUserById(ownerId);
        PropertyTbl property = PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .owner(owner)
                .build();
        return propertyRepository.save(property);
    }

    @Override
    @Transactional
    public List<UnitTbl> generateBatchUnits(UUID propertyId, PropertyDTOs.BatchUnitRequest request) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
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
                        .type(request.unitType())
                        .capacity(request.capacity())
                        .facing(FacingDirection.UNKNOWN)
                        .build();
                generatedUnits.add(unit);
            }
        }
        return unitService.saveAll(generatedUnits);
    }
}
