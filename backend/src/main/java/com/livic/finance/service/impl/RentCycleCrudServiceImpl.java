package com.livic.finance.service.impl;

import com.livic.finance.domain.RentCycleStatus;
import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.DefaulterRecordDTO;
import com.livic.finance.dto.RevenueMetricsDTO;
import com.livic.finance.repository.RentCycleRepository;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.livic.finance.dto.RentCycleDTOs;

@Service
@Transactional
public class RentCycleCrudServiceImpl extends AbstractCrudService<RentCycleTbl, UUID, RentCycleRepository> implements RentCycleCrudService {

    private final com.livic.finance.repository.LeaseRepository leaseRepository;
    private final com.livic.property.facade.UnitFacade unitFacade;

    public RentCycleCrudServiceImpl(
            RentCycleRepository rentCycleRepository,
            com.livic.finance.repository.LeaseRepository leaseRepository,
            com.livic.property.facade.UnitFacade unitFacade) {
        super(rentCycleRepository);
        this.leaseRepository = leaseRepository;
        this.unitFacade = unitFacade;
    }

    @Override
    public Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth) {
        return repository.findByLease_IdAndBillingMonth(leaseId, billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByLease_Id(UUID leaseId) {
        return repository.findByLease_Id(leaseId);
    }

    @Override
    public List<RentCycleTbl> findByLease_IdInAndBillingMonth(List<UUID> leaseIds, String billingMonth) {
        return repository.findByLease_IdInAndBillingMonth(leaseIds, billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByBillingMonth(String billingMonth) {
        return repository.findByBillingMonth(billingMonth);
    }

    @Override
    public List<RentCycleTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        List<UUID> leaseIds = getLeaseIdsForProperty(propertyId);
        if (leaseIds.isEmpty()) {
            return Collections.emptyList();
        }
        return repository.findByLease_IdInAndBillingMonth(leaseIds, billingMonth);
    }

    @Override
    public Page<RentCycleTbl> findAll(Specification<RentCycleTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    public List<RentCycleTbl> findAll(Specification<RentCycleTbl> spec) {
        return repository.findAll(spec);
    }

    @Override
    public RevenueMetricsDTO getRevenueMetrics(Collection<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        List<UUID> leaseIds = getLeaseIdsForProperties(propertyIds);
        if (leaseIds.isEmpty()) {
            return new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
        }
        RevenueMetricsDTO metrics = repository.calculateRevenueMetrics(leaseIds, billingMonth, RentCycleStatus.PAID);
        return metrics != null ? metrics : new RevenueMetricsDTO(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Override
    public Page<DefaulterRecordDTO> getDefaulters(Collection<UUID> propertyIds, Pageable pageable) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Page.empty(pageable);
        }
        List<UUID> leaseIds = getLeaseIdsForProperties(propertyIds);
        if (leaseIds.isEmpty()) {
            return Page.empty(pageable);
        }
        Page<RentCycleTbl> defaulterCycles = repository.findDefaulterCycles(
                leaseIds,
                RentCycleStatus.OVERDUE,
                RentCycleStatus.PENDING,
                LocalDate.now(),
                pageable
        );
        return defaulterCycles.map(cycle -> {
            LeaseTbl lease = cycle.getLease();
            com.livic.property.dto.UnitSummaryDTO unitSummary = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
            String unitNumber = unitSummary != null ? unitSummary.unitNumber() : "Vacant";
            String propertyName = unitSummary != null ? unitSummary.propertyName() : "N/A";
            return new DefaulterRecordDTO(
                    lease.getUserId(),
                    unitNumber,
                    propertyName,
                    cycle.getDueDate(),
                    cycle.getTotalAmount(),
                    cycle.getId()
            );
        });
    }

    @Override
    public RentCycleDTOs.RentRollMetricsDTO getRentRollMetrics(
            UUID propertyId,
            String billingMonth,
            RentCycleStatus statusPending,
            RentCycleStatus statusPublished,
            RentCycleStatus statusPaid,
            RentCycleStatus statusOverdue,
            RentCycleStatus statusPartiallyPaid
    ) {
        List<UUID> leaseIds = getLeaseIdsForProperty(propertyId);
        if (leaseIds.isEmpty()) {
            return new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L);
        }
        List<Object[]> metrics = repository.getRentRollMetrics(
                leaseIds,
                billingMonth,
                statusPending,
                statusPublished,
                statusPaid,
                statusOverdue,
                statusPartiallyPaid
        );

        BigDecimal totalExpectedRevenue = BigDecimal.ZERO;
        long pendingDraftsCount = 0;
        long publishedCount = 0;

        if (metrics != null && !metrics.isEmpty() && metrics.get(0) != null) {
            Object[] row = metrics.get(0);
            totalExpectedRevenue = (BigDecimal) (row[0] != null ? row[0] : BigDecimal.ZERO);
            pendingDraftsCount = ((Number) (row[1] != null ? row[1] : 0L)).longValue();
            publishedCount = ((Number) (row[2] != null ? row[2] : 0L)).longValue();
        }

        return new RentCycleDTOs.RentRollMetricsDTO(
                totalExpectedRevenue,
                pendingDraftsCount,
                publishedCount
        );
    }

    private List<UUID> getLeaseIdsForProperty(UUID propertyId) {
        List<com.livic.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        if (units.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> unitIds = units.stream().map(com.livic.property.dto.UnitSummaryDTO::id).toList();
        return leaseRepository.findByUnitIdInAndStatus(unitIds, com.livic.common.domain.LeaseStatus.ACTIVE).stream()
                .map(LeaseTbl::getId)
                .toList();
    }

    private List<UUID> getLeaseIdsForProperties(Collection<UUID> propertyIds) {
        if (propertyIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> unitIds = propertyIds.stream()
                .flatMap(pid -> unitFacade.getUnitsByPropertyId(pid).stream())
                .map(com.livic.property.dto.UnitSummaryDTO::id)
                .toList();
        if (unitIds.isEmpty()) {
            return Collections.emptyList();
        }
        return leaseRepository.findByUnitIdInAndStatus(unitIds, com.livic.common.domain.LeaseStatus.ACTIVE).stream()
                .map(LeaseTbl::getId)
                .toList();
    }
}
