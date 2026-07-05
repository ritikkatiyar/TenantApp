package com.tenantliving.property.service.impl;

import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.auth.service.interfaces.MembershipService;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.common.event.PropertyDeletionEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PropertyServiceImpl implements PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserQueryService userQueryService;
    private final MembershipService membershipService;
    private final UnitRepository unitRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId) {
        UserTbl creator = userQueryService.getUserById(creatorId);

        PropertyTbl property = PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .totalFloors(request.totalFloors())
                .build();
        PropertyTbl savedProperty = propertyRepository.save(property);

        // Assign OWNER role using MembershipService (no cross-module repo manipulation)
        membershipService.createOwnerMembership(savedProperty.getId(), creatorId);
        
        log.info("[PROPERTY] User {} created property: {}", creatorId, savedProperty.getId());
        return savedProperty;
    }

    @Override
    public PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setName(request.name());
        property.setAddress(request.address());
        property.setCity(request.city());
        property.setLandmark(request.landmark());
        property.setTotalFloors(request.totalFloors());
        return propertyRepository.save(property);
    }

    @Override
    public void deleteProperty(UUID propertyId) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Publish synchronous deletion event to let other modules validate/veto/cleanup if necessary
        eventPublisher.publishEvent(new PropertyDeletionEvent(this, propertyId));
        
        unitRepository.deleteByPropertyId(propertyId);
        propertyRepository.delete(property);
    }
}
