package com.tenantliving.userpropertyrole.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.userpropertyrole.repository.UserPropertyRoleRepository;
import com.tenantliving.userpropertyrole.service.interfaces.UserPropertyRoleService;
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
}
