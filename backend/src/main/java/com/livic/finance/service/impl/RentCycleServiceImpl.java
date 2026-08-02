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
import com.livic.payment.dto.PaymentInitiationRequest;
import com.livic.payment.dto.PaymentInitiationResponse;
import com.livic.payment.facade.PaymentFacade;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import com.livic.finance.strategy.ChargeCalculationService;
import com.livic.finance.strategy.CalculationResult;

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

import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;

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
    private final PaymentFacade paymentFacade;
    private final ApplicationEventPublisher eventPublisher;
    private final UnitBookingCrudService unitBookingCrudService;
    private final UserFacade userFacade;

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
        int totalUnits = activeLeases.size();
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

    @Override
    @Transactional
    public PaymentInitiationResponse initiateOnlinePayment(UUID rentCycleId, UUID payerUserId) {
        log.info("Executing initiateOnlinePayment for RentCycle: {} by user: {}", rentCycleId, payerUserId);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        BigDecimal amountPaid = rentCycle.getAmountPaid() != null ? rentCycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = rentCycle.getTotalAmount().subtract(amountPaid);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Rent cycle is already fully paid");
        }

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(payerUserId)
                .referenceType("RENT_CYCLE")
                .referenceId(rentCycleId)
                .amount(remainingAmount)
                .paymentMethod("ONLINE")
                .description("Rent Cycle Online Payment")
                .build();

        return paymentFacade.initiateOnlinePayment(initRequest);
    }

    @Override
    @Transactional
    public PaymentInitiationResponse recordCashPayment(UUID rentCycleId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy) {
        log.info("Executing recordCashPayment for RentCycle: {} amount: {}", rentCycleId, amount);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Valid positive amount is required");
        }

        UUID finalPayerId = payerUserId != null ? payerUserId : (rentCycle.getLease() != null ? rentCycle.getLease().getUserId() : confirmedBy);

        PaymentInitiationRequest initRequest = PaymentInitiationRequest.builder()
                .payerUserId(finalPayerId)
                .referenceType("RENT_CYCLE")
                .referenceId(rentCycleId)
                .amount(amount)
                .paymentMethod("CASH")
                .confirmedBy(confirmedBy)
                .note(note)
                .description("Rent Cycle Cash Payment")
                .build();

        return paymentFacade.recordCashPayment(initRequest);
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

        int roommateCount = 1;
        if (roommateCounts != null && roommateCounts.containsKey(lease.getUnit().getId())) {
            roommateCount = roommateCounts.get(lease.getUnit().getId());
        } else {
            List<LeaseTbl> activeUnitLeases = leaseCrudService.findByUnitIdAndStatus(lease.getUnit().getId(), LeaseStatus.ACTIVE);
            roommateCount = Math.max(1, activeUnitLeases.size());
        }

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

        List<RentCycleTbl> existingCycles = rentCycleCrudService.findByLease_Id(lease.getId());
        final UUID currentCycleId = cycle.getId();
        long priorCyclesCount = existingCycles.stream()
                .filter(c -> !c.getId().equals(currentCycleId))
                .count();

        if (priorCyclesCount == 0) {
            java.util.Optional<com.livic.finance.domain.UnitBookingTbl> bookingOpt =
                    unitBookingCrudService.findByStatusAndConvertedLeaseId(com.livic.common.domain.UnitBookingStatus.CONVERTED.name(), lease.getId());
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
    public Page<RentCycleDTOs.RentCycleResponse> list(UUID currentUserId, UUID leaseId, String billingMonth, RentCycleStatus status, Pageable pageable) {
        if (leaseId == null && currentUserId != null) {
            leaseId = leaseQueryService.findByUserIdAndStatus(currentUserId, com.livic.common.domain.LeaseStatus.ACTIVE)
                    .map(LeaseTbl::getId)
                    .orElse(null);
        }

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

        recordCashPayment(id, remainingAmount, "Recorded via legacy markPaid", cycle.getLease().getUserId(), confirmedBy);

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

        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        Map<UUID, RentCycleTbl> cycleByLeaseId = allMonthCycles.stream()
                .filter(c -> activeLeaseIds.contains(c.getLease().getId()))
                .collect(Collectors.toMap(c -> c.getLease().getId(), c -> c));

        List<BillingWorksheetEntryTbl> allPropertyWorksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
        Map<UUID, List<BillingWorksheetEntryTbl>> worksheetsByUnit = allPropertyWorksheets.stream()
                .collect(Collectors.groupingBy(w -> w.getUnit().getId()));

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

                    List<BillingWorksheetEntryTbl> worksheetEntries = worksheetsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (BillingWorksheetEntryTbl entry : worksheetEntries) {
                        entry.setIsBilled(true);
                        worksheetsToSave.add(entry);
                    }
                    
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

        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        Map<UUID, RentCycleTbl> cycleByLeaseId = allMonthCycles.stream()
                .filter(c -> activeLeaseIds.contains(c.getLease().getId()))
                .collect(Collectors.toMap(c -> c.getLease().getId(), c -> c));
        
        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = cycleByLeaseId.get(lease.getId());
            if (cycle != null && cycle.getStatus() == RentCycleStatus.PAID) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot unpublish bills because some tenants have already paid.");
            }
        }

        List<BillingWorksheetEntryTbl> allPropertyWorksheets = billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
        Map<UUID, List<BillingWorksheetEntryTbl>> worksheetsByUnit = allPropertyWorksheets.stream()
                .collect(Collectors.groupingBy(w -> w.getUnit().getId()));

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

                    List<BillingWorksheetEntryTbl> worksheetEntries = worksheetsByUnit.getOrDefault(lease.getUnit().getId(), List.of());
                    for (BillingWorksheetEntryTbl entry : worksheetEntries) {
                        entry.setIsBilled(false);
                        worksheetsToSave.add(entry);
                    }
                    
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
            UserSummaryDTO user = userFacade.getUserById(cycle.getLease().getUserId()).orElse(null);
            if (user != null && user.fullName() != null) {
                tenantName = user.fullName();
            }
        } catch (Exception e) {
            // Keep default
        }
        String unitNumber = cycle.getLease().getUnit() != null ? cycle.getLease().getUnit().getUnitNumber() : "Vacant";
        return RentCycleMapper.toResponse(cycle, tenantName, unitNumber, rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId()));
    }
}
