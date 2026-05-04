package com.tenantliving.rentcycle.repository;

import com.tenantliving.rentcycle.domain.RentCycleTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface RentCycleRepository extends JpaRepository<RentCycleTbl, UUID> {
}
