package com.livic.finance.repository;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaseRepository extends JpaRepository<LeaseTbl, UUID> {

    // 1. The Tenant "Hydration" Query:
    // Finds where a specific user is currently living.
    @EntityGraph(attributePaths = {"unit", "unit.property"})
    Optional<LeaseTbl> findByUserIdAndStatus(UUID userId, LeaseStatus status);

    // 2a. Single Lease Termination Query:
    // Fetches a lease with its unit and property eagerly to avoid N+1 when
    // terminateLease needs unit.property.id for role revocation.
    @EntityGraph(attributePaths = {"unit", "unit.property"})
    Optional<LeaseTbl> findWithUnitAndPropertyById(UUID id);

    // 2. The Move-In Safety Check: 
    // Checks if a Unit already has an active tenant.
    List<LeaseTbl> findByUnitIdAndStatus(UUID unitId, LeaseStatus status);

    // 3. The Landlord Dashboard Query: 
    // Fetches all active occupancies for a whole building to calculate revenue/lease rates.
    // Uses a custom @Query to prevent N+1 issues by joining the Unit table.
    @Query("SELECT o FROM LeaseTbl o JOIN FETCH o.unit r JOIN FETCH r.property WHERE r.property.id = :propertyId AND o.status = :status")
    List<LeaseTbl> findActiveOccupanciesByProperty(
            @Param("propertyId") UUID propertyId,
            @Param("status") LeaseStatus status
    );

    boolean existsByUnit_Id(UUID unitId);
    List<LeaseTbl> findByUnit_IdInAndStatus(Collection<UUID> unitIds, LeaseStatus status);

    @Query("SELECT COUNT(l) > 0 FROM LeaseTbl l JOIN l.unit u WHERE l.userId = :userId AND u.property.id = :propertyId AND l.status = :status")
    boolean existsByUserIdAndPropertyIdAndStatus(
            @Param("userId") UUID userId,
            @Param("propertyId") UUID propertyId,
            @Param("status") LeaseStatus status
    );

    boolean existsByUnit_Property_Id(UUID propertyId);
}
