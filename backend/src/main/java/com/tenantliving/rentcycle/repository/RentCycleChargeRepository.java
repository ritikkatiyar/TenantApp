package com.tenantliving.rentcycle.repository;

import com.tenantliving.rentcycle.domain.RentCycleChargeTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RentCycleChargeRepository extends JpaRepository<RentCycleChargeTbl, UUID> {
    List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId);
}
