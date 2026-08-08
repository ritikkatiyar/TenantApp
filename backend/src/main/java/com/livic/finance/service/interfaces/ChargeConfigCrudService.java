package com.livic.finance.service.interfaces;

import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.common.service.interfaces.CrudService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.livic.common.domain.ChargeCategory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChargeConfigCrudService extends CrudService<ChargeConfigTbl, UUID> {
    List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId);
    List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId);
    Page<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId, Pageable pageable);
    Page<ChargeConfigTbl> findAllByPropertyId(UUID propertyId, Pageable pageable);
    boolean existsByPropertyIdAndChargeCategory(UUID propertyId, ChargeCategory chargeCategory);
    Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id);
}
