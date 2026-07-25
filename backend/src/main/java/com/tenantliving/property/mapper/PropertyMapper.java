package com.tenantliving.property.mapper;

import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;

public final class PropertyMapper {

    private PropertyMapper() {
    }

    public static PropertyTbl toEntity(PropertyDTOs.CreatePropertyRequest request) {
        return PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .totalFloors(request.totalFloors())
                .build();
    }

    public static void updateEntity(PropertyDTOs.UpdatePropertyRequest request, PropertyTbl property) {
        property.setName(request.name());
        property.setAddress(request.address());
        property.setCity(request.city());
        property.setLandmark(request.landmark());
        property.setTotalFloors(request.totalFloors());
    }
}
