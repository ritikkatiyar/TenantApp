package com.tenantliving.property.service.impl;

import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.repository.MembershipRoleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tenantliving.finance.repository.LeaseRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PropertyServiceImpl implements PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserService userService;
    private final MembershipRepository membershipRepository;
    private final MembershipRoleRepository membershipRoleRepository;
    private final LeaseRepository leaseRepository;

    @Override
    @Transactional
    public PropertyTbl createProperty(PropertyDTOs.CreatePropertyRequest request, UUID creatorId) {
        UserTbl creator = userService.getUserById(creatorId);

        PropertyTbl property = PropertyTbl.builder()
                .name(request.name())
                .address(request.address())
                .city(request.city())
                .landmark(request.landmark())
                .totalFloors(request.totalFloors())
                .owner(creator)
                .build();
        PropertyTbl savedProperty = propertyRepository.save(property);

        String roleCode = "PROPERTY_OWNER";
        MembershipRoleTbl membershipRole = membershipRoleRepository.findByCode(roleCode)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleCode));

        MembershipTbl creatorMapping = MembershipTbl.builder()
                .user(creator)
                .property(savedProperty)
                .role(membershipRole)
                .assignedBy(creator)
                .build();
        membershipRepository.save(creatorMapping);
        
        log.info("[PROPERTY] User {} created property: {}", creatorId, savedProperty.getId());
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
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        List<MembershipTbl> memberships = membershipRepository.findByUserId(userId);
        return memberships.stream()
                .filter(m -> m.getRole() == null || !"PROPERTY_TENANT".equals(m.getRole().getCode()))
                .map(MembershipTbl::getProperty)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
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

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(UUID propertyId) {
        return propertyRepository.existsById(propertyId);
    }

    @Override
    @Transactional
    public void deleteProperty(UUID propertyId) {
        PropertyTbl property = getPropertyById(propertyId);
        
        if (leaseRepository.existsByUnit_Property_Id(propertyId)) {
            throw new RuntimeException("Cannot delete property because it has assigned tenants or leases.");
        }
        
        List<MembershipTbl> memberships = membershipRepository.findByPropertyId(propertyId);
        membershipRepository.deleteAll(memberships);
        propertyRepository.delete(property);
    }
}
