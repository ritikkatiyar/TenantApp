package com.tenantliving.userpropertyrole.service.interfaces;

import com.tenantliving.property.domain.PropertyTbl;

import java.util.List;
import java.util.UUID;

public interface UserPropertyRoleService {
    List<PropertyTbl> getPropertiesByUserId(UUID userId);
}
