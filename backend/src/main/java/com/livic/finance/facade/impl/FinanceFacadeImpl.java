package com.livic.finance.facade.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.finance.repository.LeaseRepository;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("unchecked")
public class FinanceFacadeImpl implements FinanceFacade {

    @PersistenceContext
    private final EntityManager entityManager;

    private final LeaseRepository leaseRepository;
    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final RentCycleCrudService rentCycleCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;

    @Override
    public boolean isUnitOccupiedOnDate(UUID unitId, LocalDate date) {
        List<LeaseTbl> activeLeases = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
        return activeLeases.stream().anyMatch(lease -> {
            boolean hasMovedIn = !date.isBefore(lease.getMoveInDate());
            boolean hasNotMovedOut = lease.getMoveOutDate() == null || date.isBefore(lease.getMoveOutDate());
            return hasMovedIn && hasNotMovedOut;
        });
    }

    @Override
    public Optional<LeaseSummaryDTO> getActiveLeaseForUser(UUID userId) {
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(LeaseSummaryDTO::from);
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByPropertyId(UUID propertyId) {
        return leaseQueryService.findActiveLeasesByProperty(propertyId).stream()
                .map(LeaseSummaryDTO::from)
                .toList();
    }

    @Override
    public List<LeaseSummaryDTO> getActiveLeasesByUnitId(UUID unitId) {
        return leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE).stream()
                .map(LeaseSummaryDTO::from)
                .toList();
    }

    @Override
    public Map<UUID, List<LeaseSummaryDTO>> getActiveLeasesByUnitIds(Collection<UUID> unitIds) {
        if (unitIds == null || unitIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, List<LeaseTbl>> map = leaseQueryService.findActiveLeasesByUnitIds(unitIds);
        return map.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().stream().map(LeaseSummaryDTO::from).toList()
                ));
    }

    @Override
    public boolean hasLeasesForProperty(UUID propertyId) {
        return leaseQueryService.existsByPropertyId(propertyId);
    }

    @Override
    public boolean hasLeasesForUnit(UUID unitId) {
        return leaseQueryService.existsByUnitId(unitId);
    }

    @Override
    public Optional<LeaseSummaryDTO> getLeaseById(UUID leaseId) {
        return leaseCrudService.findById(leaseId)
                .map(LeaseSummaryDTO::from);
    }

    @Override
    public Optional<UUID> getPropertyIdByRentCycleId(UUID rentCycleId) {
        return rentCycleCrudService.findById(rentCycleId)
                .map(r -> r.getLease().getUnit().getProperty().getId());
    }

    @Override
    public ChargeConfigDTOs.ChargeConfigResponse getChargeConfigById(UUID chargeConfigId) {
        return chargeConfigQueryService.getChargeConfigById(chargeConfigId);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }

        String jpql = "SELECT SUM(r.totalAmount), SUM(CASE WHEN r.status = :statusPaid THEN r.totalAmount ELSE 0.0 END) " +
                      "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit u " +
                      "WHERE u.property.id IN :propertyIds AND r.billingMonth = :billingMonth";

        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("billingMonth", billingMonth);
        query.setParameter("statusPaid", RentCycleStatus.PAID);

        Object[] result = (Object[]) query.getSingleResult();
        if (result == null || result[0] == null) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }

        BigDecimal expected = new BigDecimal(result[0].toString());
        BigDecimal collected = result[1] != null ? new BigDecimal(result[1].toString()) : BigDecimal.ZERO;
        return new RevenueMetricsDTO(expected, collected);
    }

    @Override
    public List<DefaulterRecordDTO> getDefaulters(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Collections.emptyList();
        }

        String jpql = "SELECT l.userId, unit.unitNumber, p.name, r.dueDate, r.totalAmount, r.id " +
                      "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit unit JOIN unit.property p " +
                      "WHERE p.id IN :propertyIds AND " +
                      "(r.status = :statusOverdue OR (r.status = :statusPending AND r.dueDate < :currentDate)) " +
                      "ORDER BY r.dueDate ASC";

        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("statusOverdue", RentCycleStatus.OVERDUE);
        query.setParameter("statusPending", RentCycleStatus.PENDING);
        query.setParameter("currentDate", LocalDate.now());

        List<Object[]> rows = query.getResultList();
        List<DefaulterRecordDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            UUID tenantId = (UUID) row[0];
            String unitNumber = (String) row[1];
            String propertyName = (String) row[2];
            LocalDate dueDate = (LocalDate) row[3];
            BigDecimal amountDue = (BigDecimal) row[4];
            UUID rentCycleId = (UUID) row[5];

            result.add(new DefaulterRecordDTO(tenantId, unitNumber, propertyName, dueDate, amountDue, rentCycleId));
        }
        return result;
    }

    @Override
    public BigDecimal getTotalExpenses(List<UUID> propertyIds) {
        return BigDecimal.ZERO;
    }

    @Override
    public Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds) {
        return Collections.emptyMap();
    }
}
