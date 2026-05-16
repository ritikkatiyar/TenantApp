package com.tenantliving.property.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.property.repository.UserPropertyRoleRepository;
import com.tenantliving.property.service.interfaces.UserPropertyRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserPropertyRoleServiceImpl implements UserPropertyRoleService {

    private final UserPropertyRoleRepository userPropertyRoleRepository;
    private final UserService userService;
    private final PropertyService propertyService;

    @Override
    @Transactional(readOnly = true)
    public List<PropertyTbl> getPropertiesByUserId(UUID userId) {
        try {
            userService.getUserById(userId);
        } catch (RuntimeException exception) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "User not found with id: " + userId);
        }

        LinkedHashSet<UUID> propertyIds = new LinkedHashSet<>(userPropertyRoleRepository.findPropertyIdsByUserId(userId));

        return propertyService.getPropertiesByIds(propertyIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.tenantliving.property.domain.UserPropertyRoleTbl> getRolesByUserId(UUID userId) {
        return userPropertyRoleRepository.findByUser_Id(userId);
    }

    @Override
    @Transactional
    public void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId) {
        userPropertyRoleRepository
                .findByUser_IdAndProperty_IdAndRole(tenantId, propertyId, com.tenantliving.common.domain.PropertyRole.TENANT)
                .orElseGet(() -> {
                    com.tenantliving.user.domain.UserTbl tenant = userService.getUserById(tenantId);
                    PropertyTbl property = propertyService.getPropertyById(propertyId);
                    com.tenantliving.user.domain.UserTbl assignedBy = assignedByUserId != null ? userService.getUserById(assignedByUserId) : null;
                    return userPropertyRoleRepository.save(com.tenantliving.property.domain.UserPropertyRoleTbl.builder()
                            .user(tenant)
                            .property(property)
                            .role(com.tenantliving.common.domain.PropertyRole.TENANT)
                            .assignedBy(assignedBy)
                            .build());
                });
    }
}
