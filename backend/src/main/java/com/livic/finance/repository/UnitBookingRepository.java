package com.livic.finance.repository;

import com.livic.finance.domain.UnitBookingTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitBookingRepository extends JpaRepository<UnitBookingTbl, UUID> {
    Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId);
    List<UnitBookingTbl> findByUnitIdIn(Collection<UUID> unitIds);
    List<UnitBookingTbl> findByProspectiveTenantUserId(UUID prospectiveTenantUserId);
}
