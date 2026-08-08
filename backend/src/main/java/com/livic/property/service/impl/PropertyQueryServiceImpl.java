package com.livic.property.service.impl;

import com.livic.property.domain.PropertyTbl;
import com.livic.property.service.interfaces.PropertyCrudService;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PropertyQueryServiceImpl implements PropertyQueryService {

    private final PropertyCrudService propertyCrudService;
    private final AuthFacade authFacade;

    @Override
    public Page<PropertyTbl> getPropertiesByUserId(UUID userId, Pageable pageable) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(m -> m.roleCode() == null || !"PROPERTY_TENANT".equals(m.roleCode()))
                .map(MembershipSummaryDTO::propertyId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        return propertyCrudService.findDistinctByIdIn(propertyIds, pageable);
    }

    @Override
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(m -> m.roleCode() == null || !"PROPERTY_TENANT".equals(m.roleCode()))
                .map(MembershipSummaryDTO::propertyId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        return getPropertiesByIds(propertyIds);
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
