package com.tenantliving.property.service.impl;

import com.tenantliving.common.domain.PropertyRole;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.userpropertyrole.domain.UserPropertyRoleTbl;
import com.tenantliving.userpropertyrole.repository.UserPropertyRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyServiceImpl implements PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserService userService;
    private final UserPropertyRoleRepository userPropertyRoleRepository;

    @Override
    @Transactional
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID ownerId, UUID creatorId) {
        UserTbl owner = userService.getUserById(ownerId);
        UserTbl creator = userService.getUserById(creatorId);
        PropertyTbl property = PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .totalFloors(request.totalFloors())
                .owner(owner)
                .build();
        PropertyTbl savedProperty = propertyRepository.save(property);

        PropertyRole creatorRole = creator.getId().equals(owner.getId()) ? PropertyRole.OWNER : PropertyRole.MANAGER;
        UserPropertyRoleTbl creatorMapping = UserPropertyRoleTbl.builder()
                .user(creator)
                .property(savedProperty)
                .role(creatorRole)
                .assignedBy(creator)
                .build();
        userPropertyRoleRepository.save(creatorMapping);
        return savedProperty;
    }

    @Override
    @Transactional
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
    @Transactional(readOnly = true)
    public List<PropertyTbl> getPropertiesByIds(Collection<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return List.of();
        }
        return propertyRepository.findDistinctByIdIn(propertyIds);
    }

    @Override
    @Transactional(readOnly = true)
    public PropertyTbl getPropertyById(UUID propertyId) {
        return propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
    }
}
