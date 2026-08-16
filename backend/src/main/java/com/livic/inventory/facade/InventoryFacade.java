package com.livic.inventory.facade;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface InventoryFacade {

    record InventoryPropertyMetricsDTO(
            long totalAssets, 
            long maintenanceDue, 
            long unassigned, 
            BigDecimal totalValuation
    ) {}

    InventoryPropertyMetricsDTO getPropertyMetrics(UUID propertyId);

    BigDecimal getTotalValuationForProperty(UUID propertyId);

    long getInventoryCountForProperty(UUID propertyId);

    long getAssignedInventoryCountForLease(UUID leaseId);

    Optional<UUID> getLeaseIdForAssignment(UUID assignmentId);
}
