package com.livic.finance.repository;

import com.livic.finance.domain.BillingWorksheetEntryTbl;
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

    List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(
            java.util.Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth);
            
    Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(
            UUID unitId, String billingMonth);

    List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(
            UUID propertyId, String billingMonth);

    boolean existsByChargeConfigId(UUID chargeConfigId);

    @org.springframework.data.jpa.repository.Query("SELECT e.unit.id, e.enteredValue FROM BillingWorksheetEntryTbl e WHERE e.property.id = :propertyId AND e.chargeConfig.id = :chargeConfigId AND e.billingMonth = (SELECT MAX(e2.billingMonth) FROM BillingWorksheetEntryTbl e2 WHERE e2.unit.id = e.unit.id AND e2.chargeConfig.id = :chargeConfigId AND e2.billingMonth < :billingMonth)")
    List<Object[]> findLatestValuesForPropertyAndConfig(
            @org.springframework.data.repository.query.Param("propertyId") UUID propertyId, 
            @org.springframework.data.repository.query.Param("chargeConfigId") UUID chargeConfigId, 
            @org.springframework.data.repository.query.Param("billingMonth") String billingMonth);
}
