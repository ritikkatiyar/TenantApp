package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.CalculationStrategyType;
import com.tenantliving.common.domain.ChargeCategory;
import com.tenantliving.common.domain.LedgerTransactionType;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.RentChargeType;
import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.*;
import com.tenantliving.finance.dto.RentCycleDTOs;
import com.tenantliving.finance.mapper.RentCycleMapper;
import com.tenantliving.finance.repository.*;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import com.tenantliving.finance.service.interfaces.RentCycleService;
import com.tenantliving.finance.specification.RentCycleSpecifications;
import org.springframework.data.jpa.domain.Specification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentCycleServiceImpl implements RentCycleService {

    private final RentCycleRepository rentCycleRepository;
    private final RentCycleChargeRepository rentCycleChargeRepository;
    private final LeaseQueryService leaseQueryService;
    private final LeaseRepository leaseRepository;
    private final BillingWorksheetRepository worksheetRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final FinanceLedgerRepository financeLedgerRepository;
    private final ChargeConfigRepository chargeConfigRepository;

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
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(request.propertyId(), LeaseStatus.ACTIVE);
        List<RentCycleDTOs.RentCycleResponse> responses = new ArrayList<>();
        
        for (LeaseTbl lease : activeLeases) {
            RentCycleTbl cycle = processLeaseGeneration(lease, request.billingMonth(), request.dueDate());
            responses.add(toResponse(cycle));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth) {
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        int totalUnits = activeLeases.size(); // We base totalUnits on active leases since we only bill occupied units
        int activeLeasesCount = activeLeases.size();
        
        long meteredTypesCount = chargeConfigRepository.findAllByPropertyIdAndIsActiveTrue(propertyId).stream()
                .filter(c -> c.getCalculationStrategy() == CalculationStrategyType.METERED)
                .count();
                
        int meterReadingsExpected = activeLeasesCount * (int) meteredTypesCount;
        int meterReadingsEntered = 0;
        
        try {
            String[] parts = billingMonth.split("-");
            int year = Integer.parseInt(parts[0]);
            int month = Integer.parseInt(parts[1]);
            
            for (LeaseTbl lease : activeLeases) {
                List<MeterReadingTbl> readings = meterReadingRepository.findAllByUnitIdAndBillingMonthAndBillingYear(lease.getUnit().getId(), month, year);
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
        Optional<RentCycleTbl> existingCycleOpt = rentCycleRepository.findByLease_IdAndBillingMonth(lease.getId(), billingMonthStr);
        RentCycleTbl cycle;
        BigDecimal previousTotal = BigDecimal.ZERO;

        if (existingCycleOpt.isPresent()) {
            cycle = existingCycleOpt.get();
            if (cycle.getStatus() == RentCycleStatus.PAID) {
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot regenerate a paid rent cycle for unit " + lease.getUnit().getUnitNumber());
            }
            previousTotal = cycle.getTotalAmount();
            // Delete existing charges to recreate them
            List<RentCycleChargeTbl> existingCharges = rentCycleChargeRepository.findByRentCycle_Id(cycle.getId());
            rentCycleChargeRepository.deleteAll(existingCharges);
        } else {
            cycle = RentCycleTbl.builder()
                    .lease(lease)
                    .billingMonth(billingMonthStr)
                    .dueDate(dueDate)
                    .totalAmount(BigDecimal.ZERO)
                    .status(RentCycleStatus.PENDING)
                    .build();
            cycle = rentCycleRepository.save(cycle);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        // 1. Process Billing Worksheets (FIXED & CUSTOM)
        List<BillingWorksheetEntryTbl> worksheetEntries = worksheetRepository.findAllByUnitIdAndBillingMonth(lease.getUnit().getId(), billingMonthStr);
        for (BillingWorksheetEntryTbl entry : worksheetEntries) {
            BigDecimal chargeAmount = entry.getEnteredValue() != null ? entry.getEnteredValue() : BigDecimal.ZERO;
            if (chargeAmount.compareTo(BigDecimal.ZERO) == 0) continue;

            RentChargeType chargeType = mapCategoryToType(entry.getChargeConfig().getChargeCategory());

            RentCycleChargeTbl charge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(chargeType)
                    .customChargeConfig(entry.getChargeConfig())
                    .amount(chargeAmount)
                    .description(entry.getChargeConfig().getChargeName())
                    .build();
            rentCycleChargeRepository.save(charge);

            if (chargeType == RentChargeType.DISCOUNT) {
                totalAmount = totalAmount.subtract(chargeAmount);
            } else {
                totalAmount = totalAmount.add(chargeAmount);
            }

            entry.setIsBilled(true);
            worksheetRepository.save(entry);
        }

        // 2. Process Meter Readings (METERED)
        String[] parts = billingMonthStr.split("-");
        int year = Integer.parseInt(parts[0]);
        int month = Integer.parseInt(parts[1]);

        List<MeterReadingTbl> meterReadings = meterReadingRepository.findAllByUnitIdAndBillingMonthAndBillingYear(lease.getUnit().getId(), month, year);
        for (MeterReadingTbl reading : meterReadings) {
            BigDecimal current = reading.getCurrentReading();
            if (current == null) continue; // Reading not entered yet

            BigDecimal consumption = current.subtract(reading.getPreviousReading());
            if (consumption.compareTo(BigDecimal.ZERO) < 0) consumption = BigDecimal.ZERO;

            BigDecimal rate = reading.getChargeConfig().getBaseRate() != null ? reading.getChargeConfig().getBaseRate() : BigDecimal.ZERO;
            BigDecimal chargeAmount = consumption.multiply(rate);

            if (chargeAmount.compareTo(BigDecimal.ZERO) == 0) {
                reading.setIsBilled(true);
                meterReadingRepository.save(reading);
                continue;
            }

            RentChargeType chargeType = mapCategoryToType(reading.getChargeConfig().getChargeCategory());
            String desc = reading.getChargeConfig().getChargeName() + " (" + consumption + " units)";

            RentCycleChargeTbl charge = RentCycleChargeTbl.builder()
                    .rentCycle(cycle)
                    .chargeType(chargeType)
                    .customChargeConfig(reading.getChargeConfig())
                    .amount(chargeAmount)
                    .description(desc)
                    .build();
            rentCycleChargeRepository.save(charge);

            totalAmount = totalAmount.add(chargeAmount);
            
            reading.setIsBilled(true);
            meterReadingRepository.save(reading);
        }

        cycle.setTotalAmount(totalAmount);
        RentCycleTbl savedCycle = rentCycleRepository.save(cycle);

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
            financeLedgerRepository.save(ledgerEntry);
        }

        log.info("rent_cycle_generated rentCycleId={} leaseId={} billingMonth={} totalAmount={}",
                savedCycle.getId(), lease.getId(), savedCycle.getBillingMonth(), savedCycle.getTotalAmount());
        
        return savedCycle;
    }

    private RentChargeType mapCategoryToType(ChargeCategory category) {
        return switch (category) {
            case RENT -> RentChargeType.BASE_RENT;
            case UTILITY -> RentChargeType.ELECTRICITY;
            case SERVICE -> RentChargeType.MAINTENANCE;
            case PENALTY -> RentChargeType.PENALTY;
            case DISCOUNT -> RentChargeType.DISCOUNT;
            default -> RentChargeType.CUSTOM;
        };
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleDTOs.RentCycleResponse> list(UUID leaseId, String billingMonth, RentCycleStatus status) {
        Specification<RentCycleTbl> spec = Specification
                .where(RentCycleSpecifications.hasLeaseId(leaseId))
                .and(RentCycleSpecifications.hasBillingMonth(billingMonth))
                .and(RentCycleSpecifications.hasStatus(status));

        return rentCycleRepository.findAll(spec)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse markPaid(UUID id) {
        RentCycleTbl cycle = rentCycleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        
        if (cycle.getStatus() == RentCycleStatus.PAID) {
            return toResponse(cycle);
        }
        
        cycle.setStatus(RentCycleStatus.PAID);
        cycle.setPaidAt(LocalDateTime.now());
        RentCycleTbl saved = rentCycleRepository.save(cycle);
        
        // Add payment to ledger
        FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
            .unit(cycle.getLease().getUnit())
            .lease(cycle.getLease())
            .transactionType(LedgerTransactionType.PAYMENT_RECEIVED)
            .amount(cycle.getTotalAmount().negate())
            .balance(cycle.getTotalAmount().negate()) 
            .referenceId(saved.getId())
            .description("Payment received for invoice " + cycle.getBillingMonth())
            .build();
        financeLedgerRepository.save(ledgerEntry);
        
        log.info("rent_cycle_marked_paid rentCycleId={} leaseId={} paidAt={}",
                saved.getId(), saved.getLease().getId(), saved.getPaidAt());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public List<RentCycleDTOs.RentCycleResponse> batchPublish(UUID propertyId, String billingMonth) {
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        List<RentCycleDTOs.RentCycleResponse> responses = new ArrayList<>();

        for (LeaseTbl lease : activeLeases) {
            Optional<RentCycleTbl> cycleOpt = rentCycleRepository.findByLease_IdAndBillingMonth(lease.getId(), billingMonth);
            if (cycleOpt.isPresent()) {
                RentCycleTbl cycle = cycleOpt.get();
                if (cycle.getStatus() == RentCycleStatus.PENDING) {
                    cycle.setStatus(RentCycleStatus.PUBLISHED);
                    rentCycleRepository.save(cycle);
                    log.info("rent_cycle_published rentCycleId={} leaseId={} billingMonth={}",
                            cycle.getId(), lease.getId(), billingMonth);
                }
                responses.add(toResponse(cycle));
            }
        }
        return responses;
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle) {
        return RentCycleMapper.toResponse(cycle, rentCycleChargeRepository.findByRentCycle_Id(cycle.getId()));
    }
}
