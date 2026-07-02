package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.MeterReadingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReadingTbl, UUID> {
    
    List<MeterReadingTbl> findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID propertyId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
            UUID unitId, UUID chargeConfigId, Integer billingMonth, Integer billingYear);
            
    Optional<MeterReadingTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(
            UUID unitId, UUID chargeConfigId);

    List<MeterReadingTbl> findAllByUnitIdAndBillingMonthAndBillingYear(
            UUID unitId, Integer billingMonth, Integer billingYear);
}
