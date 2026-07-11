package com.tenantliving.finance.service.impl;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.finance.domain.BillingWorksheetEntryTbl;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.domain.RentCycleTbl;
import com.tenantliving.finance.dto.BillingWorksheetDTOs.*;
import com.tenantliving.finance.repository.BillingWorksheetRepository;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.repository.RentCycleRepository;
import com.tenantliving.finance.service.BillingWorksheetService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingWorksheetServiceImpl implements BillingWorksheetService {

    private final BillingWorksheetRepository worksheetRepository;
    private final UnitQueryService unitQueryService;
    private final LeaseRepository leaseRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyQueryService propertyQueryService;
    private final UserQueryService userQueryService;
    private final RentCycleRepository rentCycleRepository;

    @Override
    @Transactional
    public List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        ChargeConfigTbl chargeConfig = chargeConfigRepository.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, LeaseTbl> unitToLeaseMap = activeLeases.stream()
                .collect(Collectors.toMap(l -> l.getUnit().getId(), l -> l, (existing, replacement) -> existing));

        List<BillingWorksheetEntryTbl> existingEntries = worksheetRepository.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
                propertyId, chargeConfigId, billingMonth);
        Map<UUID, BillingWorksheetEntryTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        List<BillingWorksheetEntryTbl> finalEntries = new ArrayList<>();
        
        UUID authUserId = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            authUserId = UUID.fromString(((UserDetailsImpl) principal).getId());
        }

        for (UnitTbl unit : units) {
            // SKIP vacant units entirely! Do not create database records for them.
            if (!unitToLeaseMap.containsKey(unit.getId())) {
                continue;
            }

            BillingWorksheetEntryTbl entry = existingEntriesMap.get(unit.getId());
            if (entry == null) {
                // Determine initial value based on autoCarryForward flag
                BigDecimal initialValue = BigDecimal.ZERO;
                if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
                    Optional<BillingWorksheetEntryTbl> lastEntry = worksheetRepository.findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(unit.getId(), chargeConfigId);
                    if (lastEntry.isPresent() && lastEntry.get().getEnteredValue() != null) {
                        initialValue = lastEntry.get().getEnteredValue();
                    } else if (chargeConfig.getBaseRate() != null) {
                        // Fallback to base rate if no history exists
                        initialValue = chargeConfig.getBaseRate();
                    }
                }

                entry = BillingWorksheetEntryTbl.builder()
                        .property(property)
                        .unit(unit)
                        .chargeConfig(chargeConfig)
                        .billingMonth(billingMonth)
                        .enteredValue(initialValue)
                        .isBilled(false)
                        .createdBy(authUserId)
                        .build();
                entry = worksheetRepository.save(entry);
            }
            finalEntries.add(entry);
        }

        return finalEntries.stream()
                .map(r -> {
            LeaseTbl lease = unitToLeaseMap.get(r.getUnit().getId());
            String tenantName = "Unknown Tenant";
            try {
                UserTbl user = userQueryService.getUserById(lease.getUserId());
                tenantName = user.getFullName();
            } catch (Exception e) {
                // Keep default
            }
            return WorksheetEntryResponse.builder()
                    .id(r.getId())
                    .unitId(r.getUnit().getId())
                    .unitName("Apt " + r.getUnit().getUnitNumber())
                    .tenantName(tenantName)
                    .floor(r.getUnit().getFloor())
                    .enteredValue(r.getEnteredValue())
                    .isBilled(r.getIsBilled())
                    .build();
        }).sorted(Comparator.comparing(WorksheetEntryResponse::getUnitName)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveWorksheet(WorksheetSaveRequest request) {
        for (UnitEntry unitEntry : request.getEntries()) {
            if (unitEntry.getEnteredValue() == null) continue;
            
            BillingWorksheetEntryTbl entry = worksheetRepository.findByUnitIdAndChargeConfigIdAndBillingMonth(
                    unitEntry.getUnitId(), request.getChargeConfigId(), request.getBillingMonth())
                    .orElseThrow(() -> new BusinessException("Worksheet entry not initialized for unit " + unitEntry.getUnitId()));
            
            if (entry.getIsBilled()) {
                List<LeaseTbl> leases = leaseRepository.findByUnitIdAndStatus(unitEntry.getUnitId(), LeaseStatus.ACTIVE);
                if (!leases.isEmpty()) {
                    Optional<RentCycleTbl> cycleOpt = rentCycleRepository.findByLease_IdAndBillingMonth(leases.get(0).getId(), request.getBillingMonth());
                    if (cycleOpt.isPresent() && (cycleOpt.get().getStatus() == RentCycleStatus.PUBLISHED || cycleOpt.get().getStatus() == RentCycleStatus.PAID)) {
                        continue; // Locked! Skip database save.
                    }
                }
            }
            entry.setEnteredValue(unitEntry.getEnteredValue());
            worksheetRepository.save(entry);
        }
    }
}
