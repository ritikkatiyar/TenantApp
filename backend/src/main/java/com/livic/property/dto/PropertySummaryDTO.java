package com.livic.property.dto;

import com.livic.property.domain.PropertyTbl;

import java.util.UUID;

public record PropertySummaryDTO(
        UUID id,
        String name,
        String address,
        String city,
        String landmark,
        Integer totalFloors,
        boolean active
) {
    public static PropertySummaryDTO from(PropertyTbl p) {
        if (p == null) {
            return null;
        }
        return new PropertySummaryDTO(
                p.getId(),
                p.getName(),
                p.getAddress(),
                p.getCity(),
                p.getLandmark(),
                p.getTotalFloors(),
                p.isActive()
        );
    }
}
