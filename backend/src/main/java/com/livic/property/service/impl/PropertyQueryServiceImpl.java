package com.livic.property.service.impl;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.common.enums.AccessType;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.service.interfaces.PropertyCrudService;
import com.livic.property.service.interfaces.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PropertyQueryServiceImpl implements PropertyQueryService {

    private final PropertyCrudService propertyCrudService;
    private final AuthFacade authFacade;

    public PropertyQueryServiceImpl(PropertyCrudService propertyCrudService, AuthFacade authFacade) {
        this.propertyCrudService = propertyCrudService;
        this.authFacade = authFacade;
    }

    @Override
    public Page<PropertyTbl> getPropertiesByUserId(UUID userId, Pageable pageable) {
        return getPropertiesByUserId(userId, null, pageable);
    }

    @Override
    public Page<PropertyTbl> getPropertiesByUserId(UUID userId, String search, Pageable pageable) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .map(MembershipSummaryDTO::propertyId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (search == null || search.trim().isEmpty()) {
            return propertyCrudService.findDistinctByIdIn(propertyIds, pageable);
        }
        return propertyCrudService.findDistinctByIdInAndSearch(propertyIds, search, pageable);
    }

    @Override
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        List<UUID> propertyIds = memberships.stream()
                .filter(MembershipSummaryDTO::isActive)
                .map(MembershipSummaryDTO::propertyId)
                .filter(Objects::nonNull)
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
