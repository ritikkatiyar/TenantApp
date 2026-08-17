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
import java.util.*;
import java.util.stream.Collectors;
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
import com.livic.property.facade.UnitFacade;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentCycleServiceImpl implements RentCycleService {

    private RentCycleService self;

    @org.springframework.beans.factory.annotation.Autowired
    public void setSelf(@org.springframework.context.annotation.Lazy RentCycleService self) {
        this.self = self;
    }

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
    private final UnitFacade unitFacade;
    private final com.livic.property.facade.PropertyFacade propertyFacade;

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request) {
        LeaseTbl lease = leaseQueryService.getLeaseById(request.leaseId());
        RentCycleTbl cycle = processLeaseGeneration(lease, request.billingMonth(), request.dueDate());
        return toResponse(cycle);
    }

    @Override
    public RentCycleDTOs.BatchGenerateResult batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request) {
        List<com.livic.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(request.propertyId());
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(com.livic.property.dto.UnitSummaryDTO::id, com.livic.property.dto.UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(com.livic.property.dto.UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        
        Map<UUID, Integer> roommateCounts = activeLeases.stream()
                .collect(Collectors.groupingBy(LeaseTbl::getUnitId, Collectors.collectingAndThen(Collectors.toList(), List::size)));

        List<RentCycleTbl> successes = new ArrayList<>();
        List<RentCycleDTOs.BatchGenerateFailure> failures = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            String unitNum = unitNumbers.get(lease.getUnitId());
            try {
                RentCycleTbl cycle = self.generateSingleInTransaction(lease, request.billingMonth(), request.dueDate(), roommateCounts);
                successes.add(cycle);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to generate rent cycle for lease ID: {}, unit: {}", lease.getId(), unitNum, e);
                failures.add(new RentCycleDTOs.BatchGenerateFailure(lease.getId(), unitNum, e.getMessage()));
            }
        }
        
        List<RentCycleDTOs.RentCycleResponse> succeededResponses = new ArrayList<>(toResponses(successes));
        succeededResponses.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return new RentCycleDTOs.BatchGenerateResult(succeededResponses, failures);
    }

    @Override
    @Transactional(readOnly = true)
    public RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        List<com.livic.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<UUID> unitIds = units.stream().map(com.livic.property.dto.UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        int totalUnits = units.size();
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
                    .collect(Collectors.groupingBy(MeterReadingTbl::getUnitId));

            for (LeaseTbl lease : activeLeases) {
                List<MeterReadingTbl> readings = readingsByUnit.getOrDefault(lease.getUnitId(), List.of());
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
                com.livic.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
                String unitNum = u != null ? u.unitNumber() : "N/A";
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid rent cycle for unit " + unitNum);
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

        BigDecimal baseRentAmount = lease.getMonthlyRentAmount() != null ? lease.getMonthlyRentAmount() : BigDecimal.ZERO;
        com.livic.property.dto.UnitSummaryDTO unitSummary = unitFacade.getUnitById(lease.getUnitId()).orElse(null);
        UUID propertyId = unitSummary != null ? unitSummary.propertyId() : null;

        List<BillingWorksheetEntryTbl> worksheetEntries = propertyId == null ? List.of() :
                billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonthStr);
        Optional<BillingWorksheetEntryTbl> rentWorksheetOpt = worksheetEntries.stream()
                .filter(w -> w.getUnitId() != null && w.getUnitId().equals(lease.getUnitId()))
                .filter(w -> w.getChargeConfig() != null && w.getChargeConfig().getChargeCategory() == ChargeCategory.RENT)
                .findFirst();
        if (rentWorksheetOpt.isPresent() && rentWorksheetOpt.get().getEnteredValue() != null) {
            baseRentAmount = rentWorksheetOpt.get().getEnteredValue();
        }

        if (baseRentAmount != null && baseRentAmount.compareTo(BigDecimal.ZERO) > 0) {
            RentCycleChargeTbl rentCharge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(RentChargeType.BASE_RENT)
                    .customChargeConfig(null)
                    .amount(baseRentAmount)
                    .description("Base Rent")
                    .build();
            rentCycleChargeCrudService.save(rentCharge);
            totalAmount = totalAmount.add(baseRentAmount);
        }

        int roommateCount = 1;
        if (roommateCounts != null && roommateCounts.containsKey(lease.getUnitId())) {
            roommateCount = roommateCounts.get(lease.getUnitId());
        } else {
            roommateCount = Math.max(1, (int) leaseCrudService.countByUnitIdAndStatus(lease.getUnitId(), LeaseStatus.ACTIVE));
        }

        List<ChargeConfigTbl> activeConfigs = propertyId == null ? List.of() :
                chargeConfigCrudService.findAllByPropertyIdAndIsActiveTrue(propertyId);
        for (ChargeConfigTbl config : activeConfigs) {
            if (config.getChargeCategory() == ChargeCategory.RENT) {
                continue;
            }
            CalculationResult result = chargeCalculationService.executeChargePipeline(config, lease.getUnitId(), billingMonthStr, false);

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
                .unitId(lease.getUnitId())
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
    public RentCycleDTOs.RentCycleListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, RentCycleStatus status, String search, Pageable pageable) {
        List<UUID> targetPropertyIds = new ArrayList<>();

        if (currentUserId != null) {
            Optional<LeaseTbl> tenantLeaseOpt = leaseQueryService.findByUserIdAndStatus(currentUserId, LeaseStatus.ACTIVE);
            if (tenantLeaseOpt.isPresent()) {
                leaseId = tenantLeaseOpt.get().getId();
                propertyId = null;
            } else {
                List<com.livic.property.dto.PropertySummaryDTO> userProperties = propertyFacade.getPropertiesByUserId(currentUserId);
                List<UUID> ownedPropertyIds = userProperties.stream().map(com.livic.property.dto.PropertySummaryDTO::id).toList();

                if (propertyId != null) {
                    if (!ownedPropertyIds.contains(propertyId)) {
                        return new RentCycleDTOs.RentCycleListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.add(propertyId);
                } else {
                    if (ownedPropertyIds.isEmpty()) {
                        return new RentCycleDTOs.RentCycleListResponse(
                                List.of(), 0, 0, pageable.getPageSize(), pageable.getPageNumber(),
                                new RentCycleDTOs.RentRollMetricsDTO(BigDecimal.ZERO, 0L, 0L)
                        );
                    }
                    targetPropertyIds.addAll(ownedPropertyIds);
                }
            }
        } else if (propertyId != null) {
            targetPropertyIds.add(propertyId);
        }

        Specification<RentCycleTbl> spec;
        if (leaseId != null) {
            spec = Specification.where(RentCycleSpecifications.hasLeaseId(leaseId));
        } else if (targetPropertyIds.size() == 1) {
            spec = Specification.where(RentCycleSpecifications.hasPropertyId(targetPropertyIds.get(0)));
        } else {
            spec = Specification.where(RentCycleSpecifications.hasPropertyIdIn(targetPropertyIds));
        }

        spec = spec.and(RentCycleSpecifications.hasBillingMonth(billingMonth))
                .and(RentCycleSpecifications.hasStatus(status))
                .and(RentCycleSpecifications.matchesSearch(search));

        Page<RentCycleTbl> page = rentCycleCrudService.findAll(spec, pageable);
        List<RentCycleDTOs.RentCycleResponse> content = toResponses(page.getContent());

        BigDecimal totalExpectedRevenue = BigDecimal.ZERO;
        long pendingDraftsCount = 0;
        long publishedCount = 0;

        if (!targetPropertyIds.isEmpty()) {
            for (UUID pid : targetPropertyIds) {
                RentCycleDTOs.RentRollMetricsDTO metrics = rentCycleCrudService.getRentRollMetrics(
                        pid,
                        billingMonth,
                        RentCycleStatus.PENDING,
                        RentCycleStatus.PUBLISHED,
                        RentCycleStatus.PAID,
                        RentCycleStatus.OVERDUE,
                        RentCycleStatus.PARTIALLY_PAID
                );
                if (metrics != null) {
                    totalExpectedRevenue = totalExpectedRevenue.add(metrics.totalExpectedRevenue());
                    pendingDraftsCount += metrics.pendingDraftsCount();
                    publishedCount += metrics.publishedCount();
                }
            }
        }

        return new RentCycleDTOs.RentCycleListResponse(
                content,
                page.getTotalElements(),
                page.getTotalPages(),
                page.getSize(),
                page.getNumber(),
                new RentCycleDTOs.RentRollMetricsDTO(
                        totalExpectedRevenue,
                        pendingDraftsCount,
                        publishedCount
                )
        );
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
    public RentCycleDTOs.RentCycleResponse publish(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        if (cycle.getStatus() == RentCycleStatus.PENDING) {
            cycle.setStatus(RentCycleStatus.PUBLISHED);
            rentCycleCrudService.save(cycle);

            if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
                UUID unitId = cycle.getLease().getUnitId();
                com.livic.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(true))
                        .toList();
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetCrudService.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(true))
                            .toList();
                    if (!unitReadings.isEmpty()) {
                        meterReadingCrudService.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            eventPublisher.publishEvent(new com.livic.common.event.RentPublishedEvent(
                    this,
                    cycle.getId(),
                    cycle.getLease().getUserId(),
                    cycle.getBillingMonth(),
                    cycle.getTotalAmount(),
                    cycle.getDueDate()
            ));

            log.info("rent_cycle_published rentCycleId={} leaseId={} billingMonth={}",
                    cycle.getId(), cycle.getLease().getId(), cycle.getBillingMonth());
        }

        return toResponse(cycle);
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse unpublish(UUID id) {
        RentCycleTbl cycle = rentCycleCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        if (cycle.getStatus() == RentCycleStatus.PAID) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot unpublish bill because tenant has already paid.");
        }

        if (cycle.getStatus() == RentCycleStatus.PUBLISHED) {
            cycle.setStatus(RentCycleStatus.PENDING);
            rentCycleCrudService.save(cycle);

            if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
                UUID unitId = cycle.getLease().getUnitId();
                com.livic.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
                UUID propertyId = u != null ? u.propertyId() : null;
                String billingMonth = cycle.getBillingMonth();

                List<BillingWorksheetEntryTbl> worksheets = propertyId == null ? List.of() :
                        billingWorksheetCrudService.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
                List<BillingWorksheetEntryTbl> unitWorksheets = worksheets.stream()
                        .filter(w -> w.getUnitId() != null && w.getUnitId().equals(unitId))
                        .peek(w -> w.setIsBilled(false))
                        .toList();
                if (!unitWorksheets.isEmpty()) {
                    billingWorksheetCrudService.saveAll(unitWorksheets);
                }

                try {
                    String[] parts = billingMonth.split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    List<MeterReadingTbl> readings = propertyId == null ? List.of() :
                            meterReadingCrudService.findByPropertyIdAndBillingMonthAndBillingYear(propertyId, month, year);
                    List<MeterReadingTbl> unitReadings = readings.stream()
                            .filter(r -> r.getUnitId() != null && r.getUnitId().equals(unitId))
                            .peek(r -> r.setIsBilled(false))
                            .toList();
                    if (!unitReadings.isEmpty()) {
                        meterReadingCrudService.saveAll(unitReadings);
                    }
                } catch (Exception e) {
                    log.warn("Failed to update meter readings for unit {}", unitId, e);
                }
            }

            log.info("rent_cycle_unpublished rentCycleId={} leaseId={} billingMonth={}",
                    cycle.getId(), cycle.getLease().getId(), cycle.getBillingMonth());
        }

        return toResponse(cycle);
    }

    @Override
    public RentCycleDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth) {
        List<com.livic.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(com.livic.property.dto.UnitSummaryDTO::id, com.livic.property.dto.UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(com.livic.property.dto.UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        Set<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).collect(Collectors.toSet());

        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        List<RentCycleTbl> propertyCycles = allMonthCycles.stream()
                .filter(c -> c.getLease() != null && activeLeaseIds.contains(c.getLease().getId()))
                .toList();

        List<RentCycleDTOs.RentCycleResponse> succeeded = new ArrayList<>();
        List<RentCycleDTOs.BatchPublishFailure> failed = new ArrayList<>();

        for (RentCycleTbl cycle : propertyCycles) {
            String unitNum = (cycle.getLease() != null) ? unitNumbers.get(cycle.getLease().getUnitId()) : null;
            try {
                RentCycleDTOs.RentCycleResponse res = self.publishSingleInTransaction(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to publish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new RentCycleDTOs.BatchPublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        succeeded.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return new RentCycleDTOs.BatchPublishResult(succeeded, failed);
    }

    @Override
    public RentCycleDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth) {
        List<com.livic.property.dto.UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        Map<UUID, String> unitNumbers = units.stream().collect(Collectors.toMap(com.livic.property.dto.UnitSummaryDTO::id, com.livic.property.dto.UnitSummaryDTO::unitNumber, (a, b) -> a));
        List<UUID> unitIds = units.stream().map(com.livic.property.dto.UnitSummaryDTO::id).toList();
        List<LeaseTbl> activeLeases = unitIds.isEmpty() ? List.of() :
                leaseCrudService.findByUnitIdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        Set<UUID> activeLeaseIds = activeLeases.stream().map(LeaseTbl::getId).collect(Collectors.toSet());

        List<RentCycleTbl> allMonthCycles = rentCycleCrudService.findByBillingMonth(billingMonth);
        List<RentCycleTbl> propertyCycles = allMonthCycles.stream()
                .filter(c -> c.getLease() != null && activeLeaseIds.contains(c.getLease().getId()))
                .toList();

        List<RentCycleDTOs.RentCycleResponse> succeeded = new ArrayList<>();
        List<RentCycleDTOs.BatchUnpublishFailure> failed = new ArrayList<>();

        for (RentCycleTbl cycle : propertyCycles) {
            String unitNum = (cycle.getLease() != null) ? unitNumbers.get(cycle.getLease().getUnitId()) : null;
            try {
                RentCycleDTOs.RentCycleResponse res = self.unpublishSingleInTransaction(cycle.getId());
                succeeded.add(res);
            } catch (Exception e) {
                log.error("[RentCycleServiceImpl] Failed to unpublish rent cycle: {}, unit: {}", cycle.getId(), unitNum, e);
                failed.add(new RentCycleDTOs.BatchUnpublishFailure(cycle.getId(), unitNum, e.getMessage()));
            }
        }

        succeeded.sort(Comparator.comparing(RentCycleDTOs.RentCycleResponse::unitNumber)
                .thenComparing(RentCycleDTOs.RentCycleResponse::tenantName));
        return new RentCycleDTOs.BatchUnpublishResult(succeeded, failed);
    }

    private List<RentCycleDTOs.RentCycleResponse> toResponses(List<RentCycleTbl> cycles) {
        if (cycles == null || cycles.isEmpty()) {
            return Collections.emptyList();
        }

        Set<UUID> userIds = cycles.stream()
                .filter(c -> c.getLease() != null && c.getLease().getUserId() != null)
                .map(c -> c.getLease().getUserId())
                .collect(Collectors.toSet());

        Set<UUID> rentCycleIds = cycles.stream()
                .filter(c -> c.getId() != null)
                .map(RentCycleTbl::getId)
                .collect(Collectors.toSet());

        Map<UUID, UserSummaryDTO> usersMap = userIds.isEmpty() ? Collections.emptyMap() : userFacade.getUsersByIds(userIds);

        Map<UUID, List<RentCycleChargeTbl>> chargesMap = rentCycleIds.isEmpty() ? Collections.emptyMap() :
                rentCycleChargeCrudService.findByRentCycle_IdIn(rentCycleIds)
                        .stream()
                        .filter(c -> c.getRentCycle() != null && c.getRentCycle().getId() != null)
                        .collect(Collectors.groupingBy(c -> c.getRentCycle().getId()));

        return cycles.stream()
                .map(cycle -> {
                    UserSummaryDTO user = cycle.getLease() != null ? usersMap.get(cycle.getLease().getUserId()) : null;
                    List<RentCycleChargeTbl> charges = chargesMap.getOrDefault(cycle.getId(), Collections.emptyList());
                    return toResponse(cycle, user, charges);
                })
                .toList();
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle) {
        UserSummaryDTO user = null;
        try {
            if (cycle.getLease() != null && cycle.getLease().getUserId() != null) {
                user = userFacade.getUserById(cycle.getLease().getUserId()).orElse(null);
            }
        } catch (Exception e) {
            // Keep default
        }
        List<RentCycleChargeTbl> charges = cycle.getId() != null ? rentCycleChargeCrudService.findByRentCycle_Id(cycle.getId()) : Collections.emptyList();
        return toResponse(cycle, user, charges);
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle, UserSummaryDTO user, List<RentCycleChargeTbl> charges) {
        String tenantName = (user != null && user.fullName() != null) ? user.fullName() : "Unknown Tenant";
        String unitNumber = "Vacant";
        if (cycle.getLease() != null && cycle.getLease().getUnitId() != null) {
            com.livic.property.dto.UnitSummaryDTO u = unitFacade.getUnitById(cycle.getLease().getUnitId()).orElse(null);
            if (u != null) {
                unitNumber = u.unitNumber();
            }
        }
        return RentCycleMapper.toResponse(cycle, tenantName, unitNumber, charges != null ? charges : Collections.emptyList());
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public RentCycleTbl generateSingleInTransaction(LeaseTbl lease, String billingMonth, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return processLeaseGeneration(lease, billingMonth, dueDate, roommateCounts);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse publishSingleInTransaction(UUID id) {
        return publish(id);
    }

    @Override
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse unpublishSingleInTransaction(UUID id) {
        return unpublish(id);
    }
}
