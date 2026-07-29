package com.livic.finance.repository;

import com.livic.finance.domain.RentCycleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RentCycleRepository extends JpaRepository<RentCycleTbl, UUID>, JpaSpecificationExecutor<RentCycleTbl> {
    Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth);

    List<RentCycleTbl> findByLease_Id(UUID leaseId);

    List<RentCycleTbl> findByBillingMonth(String billingMonth);

    List<RentCycleTbl> findByLease_IdInAndBillingMonth(java.util.Collection<UUID> leaseIds, String billingMonth);
}
