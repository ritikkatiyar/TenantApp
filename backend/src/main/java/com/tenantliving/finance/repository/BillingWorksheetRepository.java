package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.BillingWorksheetEntryTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BillingWorksheetRepository extends JpaRepository<BillingWorksheetEntryTbl, UUID> {
    
    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            UUID unitId, String billingMonth);

    boolean existsByChargeConfigId(UUID chargeConfigId);
}
