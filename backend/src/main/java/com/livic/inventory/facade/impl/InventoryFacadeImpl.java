package com.livic.inventory.facade.impl;

import com.livic.inventory.domain.LeaseInventoryAssignmentTbl;
import com.livic.inventory.domain.enums.InventoryStatus;
import com.livic.inventory.facade.InventoryFacade;
import com.livic.inventory.repository.InventoryItemRepository;
import com.livic.inventory.repository.LeaseInventoryAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryFacadeImpl implements InventoryFacade {

    private final InventoryItemRepository inventoryItemRepository;
    private final LeaseInventoryAssignmentRepository assignmentRepository;

    @Override
    public InventoryPropertyMetricsDTO getPropertyMetrics(UUID propertyId) {
        long totalAssets = inventoryItemRepository.countByPropertyId(propertyId);
        long maintenanceDue = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.SERVICE_DUE);
        long unassigned = inventoryItemRepository.countByPropertyIdAndStatus(propertyId, InventoryStatus.AVAILABLE);
        BigDecimal totalValuation = inventoryItemRepository.sumReplacementValueByPropertyId(propertyId);

        return new InventoryPropertyMetricsDTO(
                totalAssets,
                maintenanceDue,
                unassigned,
                totalValuation != null ? totalValuation : BigDecimal.ZERO
        );
    }

    @Override
    public BigDecimal getTotalValuationForProperty(UUID propertyId) {
        BigDecimal sum = inventoryItemRepository.sumReplacementValueByPropertyId(propertyId);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    @Override
    public long getInventoryCountForProperty(UUID propertyId) {
        return inventoryItemRepository.countByPropertyId(propertyId);
    }

    @Override
    public long getAssignedInventoryCountForLease(UUID leaseId) {
        return assignmentRepository.countByLeaseId(leaseId);
    }

    @Override
    public Optional<UUID> getLeaseIdForAssignment(UUID assignmentId) {
        if (assignmentId == null) {
            return Optional.empty();
        }
        return assignmentRepository.findById(assignmentId)
                .map(LeaseInventoryAssignmentTbl::getLeaseId);
    }
}
