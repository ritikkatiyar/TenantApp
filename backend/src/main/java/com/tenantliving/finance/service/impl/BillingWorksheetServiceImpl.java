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
import com.tenantliving.finance.service.interfaces.BillingWorksheetCrudService;
import com.tenantliving.finance.service.interfaces.ChargeConfigCrudService;
import com.tenantliving.finance.service.interfaces.LeaseCrudService;
import com.tenantliving.finance.service.interfaces.RentCycleCrudService;
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

    private final BillingWorksheetCrudService billingWorksheetCrudService;
    private final UnitQueryService unitQueryService;
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyQueryService propertyQueryService;
    private final UserQueryService userQueryService;
    private final RentCycleCrudService rentCycleCrudService;

    @Override
    @Transactional
    public List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, List<LeaseTbl>> unitToLeasesMap = activeLeases.stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId()));

        List<BillingWorksheetEntryTbl> existingEntries = billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
                propertyId, chargeConfigId, billingMonth);
        Map<UUID, BillingWorksheetEntryTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        List<BillingWorksheetEntryTbl> finalEntries = new ArrayList<>();
        List<BillingWorksheetEntryTbl> toSave = new ArrayList<>();
        
        UUID authUserId = null;
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            authUserId = UUID.fromString(((UserDetailsImpl) principal).getId());
        }

        Map<UUID, BigDecimal> carryForwardValues = new HashMap<>();
        if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
            List<Object[]> results = billingWorksheetCrudService.findLatestValuesForPropertyAndConfig(propertyId, chargeConfigId, billingMonth);
            for (Object[] row : results) {
                carryForwardValues.put((UUID) row[0], (BigDecimal) row[1]);
            }
        }

        for (UnitTbl unit : units) {
            // SKIP vacant units entirely! Do not create database records for them.
            if (!unitToLeasesMap.containsKey(unit.getId())) {
                continue;
            }

            BillingWorksheetEntryTbl entry = existingEntriesMap.get(unit.getId());
            if (entry == null) {
                // Determine initial value based on autoCarryForward flag and baseRate
                BigDecimal initialValue = BigDecimal.ZERO;
                if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
                    BigDecimal carryVal = carryForwardValues.get(unit.getId());
                    if (carryVal != null) {
                        initialValue = carryVal;
                    } else if (chargeConfig.getBaseRate() != null) {
                        initialValue = chargeConfig.getBaseRate();
                    }
                } else if (chargeConfig.getBaseRate() != null) {
                    initialValue = chargeConfig.getBaseRate();
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
                toSave.add(entry);
            } else {
                finalEntries.add(entry);
            }
        }

        if (!toSave.isEmpty()) {
            List<BillingWorksheetEntryTbl> saved = billingWorksheetCrudService.saveAll(toSave);
            finalEntries.addAll(saved);
        }

        Set<UUID> tenantUserIds = activeLeases.stream()
                .map(LeaseTbl::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, UserTbl> tenantsMap = userQueryService.getUsersByIds(tenantUserIds);

        return finalEntries.stream()
                .map(r -> {
            List<LeaseTbl> leases = unitToLeasesMap.get(r.getUnit().getId());
            String tenantName = "Unknown Tenant";
            if (leases != null && !leases.isEmpty()) {
                List<String> names = new ArrayList<>();
                for (LeaseTbl lease : leases) {
                    UserTbl user = tenantsMap.get(lease.getUserId());
                    if (user != null && user.getFullName() != null) {
                        names.add(user.getFullName());
                    }
                }
                if (!names.isEmpty()) {
                    tenantName = String.join(", ", names);
                }
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
        List<UUID> unitIds = request.getEntries().stream()
                .map(UnitEntry::getUnitId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (unitIds.isEmpty()) return;

        List<BillingWorksheetEntryTbl> existingEntries = billingWorksheetCrudService.findByUnitIdInAndChargeConfigIdAndBillingMonth(
                unitIds, request.getChargeConfigId(), request.getBillingMonth());
        Map<UUID, BillingWorksheetEntryTbl> entriesMap = existingEntries.stream()
                .collect(Collectors.toMap(e -> e.getUnit().getId(), e -> e));

        List<LeaseTbl> activeLeases = leaseCrudService.findByUnit_IdInAndStatus(unitIds, LeaseStatus.ACTIVE);
        Map<UUID, List<LeaseTbl>> unitToLeasesMap = activeLeases.stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId()));

        List<UUID> activeLeaseIds = activeLeases.stream()
                .map(LeaseTbl::getId)
                .collect(Collectors.toList());

        Map<UUID, RentCycleTbl> leaseToCycleMap = new HashMap<>();
        if (!activeLeaseIds.isEmpty()) {
            List<RentCycleTbl> cycles = rentCycleCrudService.findByLease_IdInAndBillingMonth(activeLeaseIds, request.getBillingMonth());
            for (RentCycleTbl cycle : cycles) {
                leaseToCycleMap.put(cycle.getLease().getId(), cycle);
            }
        }

        List<BillingWorksheetEntryTbl> toSave = new ArrayList<>();

        for (UnitEntry unitEntry : request.getEntries()) {
            if (unitEntry.getEnteredValue() == null) continue;
            
            BillingWorksheetEntryTbl entry = entriesMap.get(unitEntry.getUnitId());
            if (entry == null) {
                throw new BusinessException("Worksheet entry not initialized for unit " + unitEntry.getUnitId());
            }
            
            if (entry.getIsBilled()) {
                List<LeaseTbl> leases = unitToLeasesMap.get(unitEntry.getUnitId());
                if (leases != null && !leases.isEmpty()) {
                    RentCycleTbl cycle = leaseToCycleMap.get(leases.get(0).getId());
                    if (cycle != null && (cycle.getStatus() == RentCycleStatus.PUBLISHED || cycle.getStatus() == RentCycleStatus.PAID)) {
                        continue; // Locked! Skip database save.
                    }
                }
            }
            entry.setEnteredValue(unitEntry.getEnteredValue());
            toSave.add(entry);
        }

        if (!toSave.isEmpty()) {
            billingWorksheetCrudService.saveAll(toSave);
        }
    }
}
