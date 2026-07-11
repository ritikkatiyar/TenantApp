package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.ChargeConfigTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChargeConfigRepository extends JpaRepository<ChargeConfigTbl, UUID> {
    
    List<ChargeConfigTbl> findAllByPropertyIdAndIsActiveTrue(UUID propertyId);

    List<ChargeConfigTbl> findAllByPropertyId(UUID propertyId);

    Optional<ChargeConfigTbl> findByIdAndIsActiveTrue(UUID id);
}
