package com.tenantliving.property.repository;

import com.tenantliving.property.domain.UnitTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UnitRepository extends JpaRepository<UnitTbl, UUID> {
    List<UnitTbl> findByPropertyId(UUID propertyId);

    boolean existsByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);

    List<UnitTbl> findByPropertyIdAndFloor(UUID propertyId, Integer floor);

    @Query("SELECT COALESCE(MAX(u.floor), 0) FROM UnitTbl u WHERE u.property.id = :propertyId")
    int findMaxFloorByPropertyId(@Param("propertyId") UUID propertyId);
}
