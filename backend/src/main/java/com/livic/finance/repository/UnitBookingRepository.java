package com.livic.finance.repository;

import com.livic.finance.domain.UnitBookingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UnitBookingRepository extends JpaRepository<UnitBookingTbl, UUID> {
    java.util.Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, java.util.UUID convertedLeaseId);
}
