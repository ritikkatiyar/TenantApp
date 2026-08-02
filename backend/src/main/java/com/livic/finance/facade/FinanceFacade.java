package com.livic.finance.facade;

import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface FinanceFacade {

    boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date);

    Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId);

    List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId);

    List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId);

    Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds);

    boolean hasLeasesForProperty(UUID propertyId);

    boolean hasLeasesForUnit(UUID unitId);

    Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId);

    Optional<UUID> getPropertyIdByRentCycleId(UUID rentCycleId);

    ChargeConfigDTOs.ChargeConfigResponse getChargeConfigById(UUID chargeConfigId);

    // Analytics Read Methods
    record RevenueMetricsDTO(BigDecimal expected, BigDecimal collected) {}

    record DefaulterRecordDTO(UUID tenantId, String unitNumber, String propertyName, LocalDate dueDate, BigDecimal amountDue, UUID rentCycleId) {}

    RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth);

    List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds);

    BigDecimal getTotalExpenses(List<UUID> propertyIds);

    Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds);
}
