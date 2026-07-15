package com.tenantliving.property.service.impl;

import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.service.interfaces.PropertyCrudService;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import com.tenantliving.auth.service.interfaces.MembershipQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyQueryServiceImpl implements PropertyQueryService {

    private final PropertyCrudService propertyCrudService;
    private final MembershipQueryService membershipQueryService;

    @Override
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        List<com.tenantliving.auth.domain.MembershipTbl> memberships = membershipQueryService.getMembershipsByUserId(userId);
        return memberships.stream()
                .filter(m -> m.getRole() == null || !"PROPERTY_TENANT".equals(m.getRole().getCode()))
                .map(com.tenantliving.auth.domain.MembershipTbl::getProperty)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
    }

    @Override
    public List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return propertyCrudService.findDistinctByIdIn(propertyIds);
    }

    @Override
    public PropertyTbl getPropertyById(UUID propertyId) {
        return propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }

    @Override
    public boolean existsById(UUID propertyId) {
        return propertyCrudService.existsById(propertyId);
    }

    @Override
    public List<PropertyTbl> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyCrudService.findByAutoBillDayOfMonth(day);
    }
}
