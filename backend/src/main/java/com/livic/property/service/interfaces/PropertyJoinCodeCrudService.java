package com.livic.property.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.property.domain.PropertyJoinCodeTbl;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyJoinCodeCrudService extends CrudService<PropertyJoinCodeTbl, UUID> {
    Optional<PropertyJoinCodeTbl> findByCode(String code);
    List<PropertyJoinCodeTbl> findByPropertyId(UUID propertyId);
}
