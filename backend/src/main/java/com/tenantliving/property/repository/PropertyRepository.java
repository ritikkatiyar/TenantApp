package com.tenantliving.property.repository;

import com.tenantliving.property.domain.PropertyTbl;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<PropertyTbl, UUID> {
    List<PropertyTbl> findByOwnerId(UUID ownerId);

    @EntityGraph(attributePaths = "owner")
    List<PropertyTbl> findDistinctByIdIn(Collection<UUID> propertyIds);
}
