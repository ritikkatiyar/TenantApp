package com.livic.property.mapper;

import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyDTOs;

public final class PropertyMapper {

    private PropertyMapper() {
    }

    public static PropertyTbl toEntity(PropertyDTOs.CreatePropertyRequest request) {
        java.util.List<String> am = request.amenities() != null ? new java.util.ArrayList<>(request.amenities()) : new java.util.ArrayList<>();
        return PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .totalFloors(request.totalFloors())
                .amenities(am)
                .build();
    }

    public static void updateEntity(PropertyDTOs.UpdatePropertyRequest request, PropertyTbl property) {
        property.setName(request.name());
        property.setAddress(request.address());
        property.setCity(request.city());
        property.setLandmark(request.landmark());
        property.setTotalFloors(request.totalFloors());
        if (request.amenities() != null) {
            property.getAmenities().clear();
            property.getAmenities().addAll(request.amenities());
        }
    }
}
