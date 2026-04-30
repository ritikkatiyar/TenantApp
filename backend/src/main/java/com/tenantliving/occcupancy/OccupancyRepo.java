package com.tenantliving.occcupancy;

import com.tenantliving.enums.OccupancyStatus;
import com.tenantliving.occcupancy.Occupancy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OccupancyRepo extends JpaRepository<Occupancy, UUID> {

    // 1. The Tenant "Hydration" Query: 
    // Finds where a specific user is currently living.
    Optional<Occupancy> findByUserIdAndStatus(UUID userId, OccupancyStatus status);

    // 2. The Move-In Safety Check: 
    // Checks if a room already has an active tenant (useful for single rooms).
    List<Occupancy> findByRoomIdAndStatus(UUID roomId, OccupancyStatus status);

    // 3. The Landlord Dashboard Query: 
    // Fetches all active occupancies for a whole building to calculate revenue/occupancy rates.
    // Uses a custom @Query to prevent N+1 issues by joining the Room table.
    @Query("SELECT o FROM Occupancy o JOIN FETCH o.room r WHERE r.property.id = :propertyId AND o.status = :status")
    List<Occupancy> findActiveOccupanciesByProperty(
            @Param("propertyId") UUID propertyId,
            @Param("status") OccupancyStatus status
    );
}