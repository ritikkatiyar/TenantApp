package com.livic.finance.service.impl;

import com.livic.common.domain.CalculationStrategyType;
import com.livic.common.domain.ChargeCategory;
import com.livic.common.domain.LedgerTransactionType;
import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.RentChargeType;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.*;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.finance.mapper.RentCycleMapper;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleService;
import com.livic.finance.specification.RentCycleSpecifications;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import com.livic.payment.service.interfaces.PaymentTransactionService;
import com.livic.finance.strategy.ChargeCalculationService;
import com.livic.finance.strategy.CalculationResult;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.domain.UserTbl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;
import java.util.UUID;
import java.util.Comparator;
import java.util.stream.Collectors;

import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.MeterReadingCrudService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import com.livic.finance.service.interfaces.RentCycleChargeCrudService;
import com.livic.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.UnitBookingCrudService;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentCycleServiceImpl implements RentCycleService {

    private final RentCycleCrudService rentCycleCrudService;
    private final RentCycleChargeCrudService rentCycleChargeCrudService;
    private final LeaseQueryService leaseQueryService;
    private final LeaseCrudService leaseCrudService;
    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final MeterReadingCrudService meterReadingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final ChargeCalculationService chargeCalculationService;
    private final UserQueryService userQueryService;
    private final PaymentTransactionService paymentTransactionService;
    private final ApplicationEventPublisher eventPublisher;
    private final UnitBookingCrudService unitBookingCrudService;

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request) {
        LeaseTbl lease = leaseQueryService.getLeaseById(request.leaseId());
        RentCycleTbl cycle = processLeaseGeneration(lease, request.billingMonth(), request.dueDate());
        return toResponse(cycle);
    }

    @Override
    @Transactional
    public List<RentCycleDTOs.RentCycleResponse> batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request) {
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(request.propertyId(), LeaseStatus.ACTIVE);
        
        // Optimized: pre-calculate roommate counts in bulk to avoid unit queries in loop
        Map<UUID, Integer> roommateCounts = activeLeases.stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId(), Collectors.collectingAndThen(Collectors.toList(), List::size)));

        List<RentCycleDTOs.RentCycleResponse> responses = new ArrayList<>();
        
        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = processLeaseGeneration(lease, request.billingMonth(), request.dueDate(), roommateCounts);
            responses.add(toResponse(cycle));
        }
        
        responses.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        int totalUnits = activeLeases.size(); // We base totalUnits on active leases since we only bill occupied units
        int activeLeasesCount = activeLeases.size();
        
        long meteredTypesCount = chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .filter(c -> c.getCalculationStrategy() == CalculationStrategyType.METERED)
                .count();
                
        int meterReadingsExpected = activeLeasesCount * (int) meteredTypesCount;
        int meterReadingsEntered = 0;
        
        try {
            String[] parts = billingMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            
            // Optimized: fetch property meter readings in bulk
            List<MeterReadingTbl> propertyReadings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
            Map<UUID, List<MeterReadingTbl>> readingsByUnit = propertyReadings.stream()
                    .collect(Collectors.groupingBy(r -> r.getUnit().getId()));

            for (LeaseTbl lease : activeLeases) {
                List<MeterReadingTbl> readings = readingsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                long enteredForLease = readings.stream().filter(r -> r.getCurrentReading() != null).count();
                meterReadingsEntered += enteredForLease;
            }
        } catch (Exception e) {
            log.warn("Failed to calculate meter readings for checklist", e);
        }

        boolean isReady = (meterReadingsEntered >= meterReadingsExpected) || activeLeasesCount == 0;
        return new RentCycleDTOs.PreFlightChecklistResponse(
            totalUnits, 
            activeLeasesCount, 
            meterReadingsExpected, 
            meterReadingsEntered, 
            isReady
        );
    }

    private RentCycleTbl processLeaseGeneration(LeaseTbl lease, String billingMonthStr, LocalDate dueDate) {
        return processLeaseGeneration(lease, billingMonthStr, dueDate, null);
    }

    private RentCycleTbl processLeaseGeneration(LeaseTbl lease, String billingMonthStr, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        Optional<RentCycleTbl> existingCycleOpt = rentCycleCrudService.findByLease_IdAndBillingMonth(lease.getId(), billingMonthStr);
        RentCycleTbl cycle;
        BigDecimal previousTotal = BigDecimal.ZERO;

        if (existingCycleOpt.isPresent()) {
            cycle = existingCycleOpt.get();
            if (cycle.getStatus() == RentCycleStatus.PAID) {
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid rent cycle for unit " + lease.getUnit().getUnitNumber());
            }
            previousTotal = cycle.getTotalAmount();
            // Delete existing charges to recreate them
            List<RentCycleChargeTbl> existingCharges = rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId());
            rentCycleChargeCrudService.deleteAll(existingCharges);
        } else {
            cycle = RentCycleTbl.builder()
                    .lease(lease)
                    .billingMonth(billingMonthStr)
                    .dueDate(dueDate)
                    .totalAmount(BigDecimal.ZERO)
                    .status(RentCycleStatus.PENDING)
                    .build();
            cycle = rentCycleCrudService.save(cycle);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        // Optimized: roommate count pre-computed lookup
        int roommateCount = 1;
        if (roommateCounts != null && roommateCounts.containsKey(lease.getUnit().getId())) {
            roommateCount = roommateCounts.get(lease.getUnit().getId());
        } else {
            List<LeaseTbl> activeUnitLeases = leaseCrudService.findByUnitIdAndStatus(lease.getUnit().getId(), LeaseStatus.ACTIVE);
            roommateCount = Math.max(1, activeUnitLeases.size());
        }

        // 1. Process all active charge configurations using Strategy Engine
        List<ChargeConfigTbl> activeConfigs = chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(lease.getUnit().getProperty().getId());
        for (ChargeConfigTbl config : activeConfigs) {
            CalculationResult result = chargeCalculationService.executeChargePipeline(config, lease.getUnit().getId(), billingMonthStr, false);

            BigDecimal chargeAmount = result.amount();
            if (chargeAmount.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            if (roommateCount > 1) {
                chargeAmount = chargeAmount.divide(BigDecimal.valueOf(roommateCount), 2, java.math.RoundingMode.HALF_UP);
            }

            RentChargeType chargeType = mapCategoryToType(config.getChargeCategory());
            String desc = config.getChargeName();
            if (result.descriptionDetail() != null) {
                desc += " (" + result.descriptionDetail() + ")";
            }

            RentCycleChargeTbl charge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(chargeType)
                    .customChargeConfig(config)
                    .amount(chargeAmount)
                    .description(desc)
                    .build();
            rentCycleChargeCrudService.save(charge);

            if (chargeType == RentChargeType.DISCOUNT) {
                totalAmount = totalAmount.subtract(chargeAmount);
            } else {
                totalAmount = totalAmount.add(chargeAmount);
            }
        }

        // First-cycle check for token bookings
        List<RentCycleTbl> existingCycles = rentCycleCrudService.findByLease_Id(lease.getId());
        final UUID currentCycleId = cycle.getId();
        long priorCyclesCount = existingCycles.stream()
                .filter(c -> !c.getId().equals(currentCycleId))
                .count();

        if (priorCyclesCount == 0) {
            java.util.Optional<com.livic.finance.domain.UnitBookingTbl> bookingOpt =
                    unitBookingCrudService.findByStatusAndConvertedLeaseId("CONVERTED", lease.getId());
            if (bookingOpt.isPresent()) {
                com.livic.finance.domain.UnitBookingTbl booking = bookingOpt.get();
                RentCycleChargeTbl discountCharge = RentCycleChargeTbl.builder()
                        .rentCycle(cycle)
                        .chargeType(RentChargeType.DISCOUNT)
                        .amount(booking.getTokenAmount())
                        .description("Token amount adjustment from unit booking")
                        .build();
                rentCycleChargeCrudService.save(discountCharge);
                totalAmount = totalAmount.subtract(booking.getTokenAmount());
            }
        }

        cycle.setTotalAmount(totalAmount);
        RentCycleTbl savedCycle = rentCycleCrudService.save(cycle);

        // Ledger entry for the delta
        BigDecimal delta = totalAmount.subtract(previousTotal);
        if (delta.compareTo(BigDecimal.ZERO) != 0) {
            FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unit(lease.getUnit())
                .lease(lease)
                .transactionType(existingCycleOpt.isPresent() ? LedgerTransactionType.ADJUSTMENT : LedgerTransactionType.INVOICE_GENERATED)
                .amount(delta)
                .balance(delta)
                .referenceId(savedCycle.getId())
                .description("Invoice " + (existingCycleOpt.isPresent() ? "Regeneration" : "Generation") + " for " + billingMonthStr)
                .build();
            financeLedgerCrudService.save(ledgerEntry);
        }

        log.info("rent_cycle_generated rentCycleId={} leaseId={} billingMonth={} totalAmount={}",
                savedCycle.getId(), lease.getId(), savedCycle.getBillingMonth(), savedCycle.getTotalAmount());
        
        return savedCycle;
    }

    private RentChargeType mapCategoryToType(ChargeCategory category) {
        return switch (category) {
            case RENT -> RentChargeType.BASE_RENT;
            case ELECTRICITY -> RentChargeType.ELECTRICITY;
            case SERVICE -> RentChargeType.MAINTENANCE;
            case PENALTY -> RentChargeType.PENALTY;
            case DISCOUNT -> RentChargeType.DISCOUNT;
            default -> RentChargeType.CUSTOM;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RentCycleDTOs.RentCycleResponse> list(UUID leaseId, String billingMonth, RentCycleStatus status, Pageable pageable) {
        Specification<RentCycleTbl> spec = Specification
                .where(RentCycleSpecifications.hasLeaseId(leaseId))
                .and(RentCycleSpecifications.hasBillingMonth(billingMonth))
                .and(RentCycleSpecifications.hasStatus(status));

        return rentCycleCrudService.findAll(spec, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse markPaid(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        
        if (cycle.getStatus() == RentCycleStatus.PAID) {
            return toResponse(cycle);
        }

        UUID confirmedBy = null;
        org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.getContext();
        if (context != null && context.getAuthentication() != null && context.getAuthentication().getPrincipal() instanceof com.livic.auth.principal.UserDetailsImpl) {
            confirmedBy = UUID.fromString(((com.livic.auth.principal.UserDetailsImpl) context.getAuthentication().getPrincipal()).getId());
        }
        if (confirmedBy == null) {
            confirmedBy = cycle.getLease().getUserId();
        }

        BigDecimal amountPaid = cycle.getAmountPaid() != null ? cycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = cycle.getTotalAmount().subtract(amountPaid);

        paymentTransactionService.recordCashPayment(
                cycle.getLease().getUserId(),
                "RENT_CYCLE",
                cycle.getId(),
                remainingAmount,
                confirmedBy,
                "Recorded via legacy markPaid"
        );

        RentCycleTbl updated = rentCycleCrudService.findById(id).orElse(cycle);
        log.info("rent_cycle_marked_paid rentCycleId={} leaseId={} paidAt={}",
                updated.getId(), updated.getLease().getId(), updated.getPaidAt());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public List<RentCycleDTOs.RentCycleResponse> batchPublish(UUID propertyId, String billingMonth) {
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Set<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).collect(Collectors.toSet());

        // Optimized: Fetch all rent cycles for this month in bulk, filter in memory
        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        Map<UUID, RentCycleTbl> cycleByLeaseId = allMonthCycles.stream()
                .filter(c -> activeLeaseIds.contains(c.getLease().getId()))
                .collect(Collectors.toMap(c -> c.getLease().getId(), c -> c));

        // Optimized: Fetch all worksheet entries for the property in bulk
        List<BillingWorksheetEntryTbl> allPropertyWorksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
        Map<UUID, List<BillingWorksheetEntryTbl>> worksheetsByUnit = allPropertyWorksheets.stream()
                .collect(Collectors.groupingBy(w -> w.getUnit().getId()));

        // Optimized: Fetch all meter readings for the property in bulk
        String[] parts = billingMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        List<MeterReadingTbl> allPropertyReadings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
        Map<UUID, List<MeterReadingTbl>> readingsByUnit = allPropertyReadings.stream()
                .collect(Collectors.groupingBy(r -> r.getUnit().getId()));

        List<RentCycleTbl> cyclesToSave = new ArrayList<>();
        List<BillingWorksheetEntryTbl> worksheetsToSave = new ArrayList<>();
        List<MeterReadingTbl> readingsToSave = new ArrayList<>();
        List<RentCycleDTOs.RentCycleResponse> responses = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = cycleByLeaseId.get(lease.getId());
            if (cycle != null) {
                if (cycle.getStatus() == RentCycleStatus.PENDING) {
                    cycle.setStatus(RentCycleStatus.PUBLISHED);
                    cyclesToSave.add(cycle);

                    // LOCK worksheet entries in-memory
                    List<BillingWorksheetEntryTbl> worksheetEntries = worksheetsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (BillingWorksheetEntryTbl entry : worksheetEntries) {
                        entry.setIsBilled(true);
                        worksheetsToSave.add(entry);
                    }
                    
                    // LOCK meter readings in-memory
                    List<MeterReadingTbl> meterReadings = readingsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (MeterReadingTbl reading : meterReadings) {
                        reading.setIsBilled(true);
                        readingsToSave.add(reading);
                    }

                    log.info("rent_cycle_published rentCycleId={} leaseId={} billingMonth={}",
                            cycle.getId(), lease.getId(), billingMonth);
                }
                responses.add(toResponse(cycle));
            }
        }

        // Optimized: batch saves outside the loop
        if (!cyclesToSave.isEmpty()) {
            rentCycleCrudService.saveAll(cyclesToSave);
            for (RentCycleTbl c : cyclesToSave) {
                eventPublisher.publishEvent(new com.livic.common.event.RentPublishedEvent(
                        this,
                        c.getId(),
                        c.getLease().getUserId(),
                        c.getBillingMonth(),
                        c.getTotalAmount(),
                        c.getDueDate()
                ));
            }
        }
        if (!worksheetsToSave.isEmpty()) {
            billingWorksheetCrudService.saveAll(worksheetsToSave);
        }
        if (!readingsToSave.isEmpty()) {
            meterReadingCrudService.saveAll(readingsToSave);
        }

        responses.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return responses;
    }

    @Override
    @Transactional
    public List<RentCycleDTOs.RentCycleResponse> batchUnpublish(UUID propertyId, String billingMonth) {
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Set<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).collect(Collectors.toSet());

        // Optimized: Fetch all rent cycles for this month in bulk, filter in memory
        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        Map<UUID, RentCycleTbl> cycleByLeaseId = allMonthCycles.stream()
                .filter(c -> activeLeaseIds.contains(c.getLease().getId()))
                .collect(Collectors.toMap(c -> c.getLease().getId(), c -> c));
        
        // Validation pass
        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = cycleByLeaseId.get(lease.getId());
            if (cycle != null && cycle.getStatus() == RentCycleStatus.PAID) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot unpublish bills because some tenants have already paid.");
            }
        }

        // Optimized: Fetch all worksheet entries for the property in bulk
        List<BillingWorksheetEntryTbl> allPropertyWorksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
        Map<UUID, List<BillingWorksheetEntryTbl>> worksheetsByUnit = allPropertyWorksheets.stream()
                .collect(Collectors.groupingBy(w -> w.getUnit().getId()));

        // Optimized: Fetch all meter readings for the property in bulk
        String[] parts = billingMonth.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);
        List<MeterReadingTbl> allPropertyReadings = meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
        Map<UUID, List<MeterReadingTbl>> readingsByUnit = allPropertyReadings.stream()
                .collect(Collectors.groupingBy(r -> r.getUnit().getId()));

        List<RentCycleTbl> cyclesToSave = new ArrayList<>();
        List<BillingWorksheetEntryTbl> worksheetsToSave = new ArrayList<>();
        List<MeterReadingTbl> readingsToSave = new ArrayList<>();
        List<RentCycleDTOs.RentCycleResponse> responses = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = cycleByLeaseId.get(lease.getId());
            if (cycle != null) {
                if (cycle.getStatus() == RentCycleStatus.PUBLISHED) {
                    cycle.setStatus(RentCycleStatus.PENDING);
                    cyclesToSave.add(cycle);

                    // UNLOCK worksheet entries in-memory
                    List<BillingWorksheetEntryTbl> worksheetEntries = worksheetsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (BillingWorksheetEntryTbl entry : worksheetEntries) {
                        entry.setIsBilled(false);
                        worksheetsToSave.add(entry);
                    }
                    
                    // UNLOCK meter readings in-memory
                    List<MeterReadingTbl> meterReadings = readingsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (MeterReadingTbl reading : meterReadings) {
                        reading.setIsBilled(false);
                        readingsToSave.add(reading);
                    }

                    log.info("rent_cycle_unpublished rentCycleId={} leaseId={} billingMonth={}",
                            cycle.getId(), lease.getId(), billingMonth);
                }
                responses.add(toResponse(cycle));
            }
        }

        // Optimized: batch saves outside the loop
        if (!cyclesToSave.isEmpty()) {
            rentCycleCrudService.saveAll(cyclesToSave);
        }
        if (!worksheetsToSave.isEmpty()) {
            billingWorksheetCrudService.saveAll(worksheetsToSave);
        }
        if (!readingsToSave.isEmpty()) {
            meterReadingCrudService.saveAll(readingsToSave);
        }

        responses.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return responses;
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle) {
        String tenantName = "Unknown Tenant";
        try {
            UserTbl user = userQueryService.getUserById(cycle.getLease().getUserId());
            if (user.getFullName() != null) {
                tenantName = user.getFullName();
            }
        } catch (Exception e) {
            // Keep default
        }
        String unitNumber = cycle.getLease().getUnit() != null ? cycle.getLease().getUnit().getUnitNumber() : "Vacant";
        return RentCycleMapper.toResponse(cycle, tenantName, unitNumber, rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId()));
    }
}
