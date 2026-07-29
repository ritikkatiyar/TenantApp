package com.livic.property.service.impl;

import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyDTOs;
import com.livic.property.service.interfaces.PropertyCrudService;
import com.livic.property.service.interfaces.PropertyService;
import com.livic.property.mapper.PropertyMapper;
import com.livic.user.domain.UserTbl;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.property.service.interfaces.UnitCrudService;
import com.livic.common.event.PropertyDeletionEvent;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.common.exception.BusinessException;
import org.springframework.http.HttpStatus;

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
    private final PropertyCrudService propertyCrudService;
    private final UserQueryService userQueryService;
    private final MembershipService membershipService;
    private final UnitCrudService unitCrudService;
    private final ApplicationEventPublisher eventPublisher;
    private final LeaseQueryService leaseQueryService;

    @Override
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId) {
        UserTbl creator = userQueryService.getUserById(creatorId);

        PropertyTbl property = PropertyMapper.toEntity(request);
        PropertyTbl savedProperty = propertyCrudService.save(property);

        // Assign OWNER role using MembershipService (no cross-module repo manipulation)
        membershipService.createOwnerMembership(savedProperty.getId(), creatorId);
        
        log.info("[PROPERTY] User {} created property: {}", creatorId, savedProperty.getId());
        return savedProperty;
    }

    @Override
    public PropertyTbl updateProperty(UUID propertyId, PropertyDTOs.UpdatePropertyRequest request) {
        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        PropertyMapper.updateEntity(request, property);
        return propertyCrudService.save(property);
    }

    @Override
    public void deleteProperty(UUID propertyId) {
        if (leaseQueryService.existsByPropertyId(propertyId)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete property because it has assigned tenants or leases.");
        }

        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        
        // Publish synchronous deletion event to let other modules validate/veto/cleanup if necessary
        eventPublisher.publishEvent(new PropertyDeletionEvent(this, propertyId));
        
        unitCrudService.deleteByPropertyId(propertyId);
        propertyCrudService.delete(property);
    }

    @Override
    public PropertyTbl togglePropertyActiveStatus(UUID propertyId, boolean active) {
        PropertyTbl property = propertyCrudService.findById(propertyId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        property.setActive(active);
        return propertyCrudService.save(property);
    }
}
