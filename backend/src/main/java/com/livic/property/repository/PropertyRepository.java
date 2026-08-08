package com.livic.property.repository;

import com.livic.property.domain.PropertyTbl;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyTbl, UUID> {
    @Query("SELECT m.property FROM MembershipTbl m WHERE m.user.id = :userId AND m.role.code IN ('PROPERTY_OWNER', 'SOCIETY_MANAGER')")
    List<PropertyTbl> findPropertiesByOwnerId(@Param("userId") UUID userId);

    List<PropertyTbl> findByAutoBillDayOfMonth(Integer autoBillDayOfMonth);

    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);

    Page<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds, Pageable pageable);
}
