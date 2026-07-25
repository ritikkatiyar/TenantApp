package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.UnitBookingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UnitBookingRepository extends JpaRepository<UnitBookingTbl, UUID> {
    java.util.Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, java.util.UUID convertedLeaseId);
}
