package com.livic.finance.service.interfaces;

import com.livic.finance.domain.BillingWorksheetEntryTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingWorksheetCrudService extends CrudService<BillingWorksheetEntryTbl, UUID> {
    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            UUID unitId, String billingMonth);

    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            UUID propertyId, String billingMonth);

    boolean existsByChargeConfigId(UUID chargeConfigId);

    List<Object[]> findLatestValuesForPropertyAndConfig(
            UUID propertyId, UUID chargeConfigId, String billingMonth);

    List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth);
}
