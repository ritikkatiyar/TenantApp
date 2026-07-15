package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChargeConfigCrudService extends CrudService<ChargeConfigTbl, UUID> {
    List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId);
    List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId);
    Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id);
}
