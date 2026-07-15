package com.tenantliving.property.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.property.domain.PropertyJoinCodeTbl;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyJoinCodeCrudService extends CrudService<PropertyJoinCodeTbl, UUID> {
    Optional<PropertyJoinCodeTbl> findByCode(String code);
    List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId);
}
