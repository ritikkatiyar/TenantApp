package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.MeterReadingTbl;
import com.livic.finance.dto.MeterReadingDTOs.*;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.MeterReadingCrudService;
import com.livic.finance.service.MeterReadingService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.domain.UnitTbl;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.property.service.interfaces.UnitQueryService;
import com.livic.user.domain.UserTbl;
import com.livic.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MeterReadingServiceImpl implements MeterReadingService {

    private final MeterReadingCrudService meterReadingCrudService;
    private final UnitQueryService unitQueryService;
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyQueryService propertyQueryService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        if (!"METERED".equals(chargeConfig.getCalculationStrategy().name())) {
            throw new BusinessException("Charge config is not a metered strategy");
        }

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, LeaseTbl> unitToLeaseMap = activeLeases.stream()
                .collect(Collectors.toMap(l -> l.getUnit().getId(), l -> l, (existing, replacement) -> existing));

        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, month, year);
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        // Optimized: Fetch previous readings for the entire property in bulk
        int previousMonth = month == 1 ? 12 : month - 1;
        int previousYear = month == 1 ? year - 1 : year;
        List<MeterReadingTbl> prevMonthReadings = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, previousMonth, previousYear);
        Map<UUID, MeterReadingTbl> prevMonthReadingsMap = prevMonthReadings.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        // Optimized: Fetch all historical readings for this config in the property in bulk to fallback to latest
        List<MeterReadingTbl> historicalReadings = meterReadingCrudService.findByPropertyIdAndChargeConfigId(propertyId, chargeConfigId);
        Map<UUID, MeterReadingTbl> absoluteLatestMap = historicalReadings.stream()
                .collect(Collectors.toMap(
                        r -> r.getUnit().getId(),
                        r -> r,
                        (existing, replacement) -> {
                            if (replacement.getBillingYear() > existing.getBillingYear()) {
                                return replacement;
                            } else if (replacement.getBillingYear().equals(existing.getBillingYear())) {
                                if (replacement.getBillingMonth() > existing.getBillingMonth()) {
                                    return replacement;
                                }
                            }
                            return existing;
                        }
                ));

        List<MeterReadingTbl> finalEntries = new ArrayList<>();
        List<MeterReadingTbl> newEntriesToSave = new ArrayList<>();

        for (UnitTbl unit : units) {
            MeterReadingTbl entry = existingEntriesMap.get(unit.getId());
            if (entry == null) {
                BigDecimal previousReading = BigDecimal.ZERO;

                // Optimized: Check in-memory maps instead of running queries in the loop
                MeterReadingTbl lastEntry = prevMonthReadingsMap.get(unit.getId());
                if (lastEntry != null && lastEntry.getCurrentReading() != null) {
                    previousReading = lastEntry.getCurrentReading();
                } else {
                    MeterReadingTbl absoluteLast = absoluteLatestMap.get(unit.getId());
                    if (absoluteLast != null && absoluteLast.getCurrentReading() != null) {
                        previousReading = absoluteLast.getCurrentReading();
                    }
                }

                entry = MeterReadingTbl.builder()
                        .property(property)
                        .unit(unit)
                        .chargeConfig(chargeConfig)
                        .billingMonth(month)
                        .billingYear(year)
                        .previousReading(previousReading)
                        .currentReading(null)
                        .isBilled(false)
                        .build();
                newEntriesToSave.add(entry);
            } else {
                finalEntries.add(entry);
            }
        }

        // Optimized: Bulk save initialized readings
        if (!newEntriesToSave.isEmpty()) {
            finalEntries.addAll(meterReadingCrudService.saveAll(newEntriesToSave));
        }

        // Optimized: Fetch user details in bulk outside stream map
        Set<UUID> userIds = activeLeases.stream().map(LeaseTbl::getUserId).collect(Collectors.toSet());
        Map<UUID, UserTbl> usersMap = userQueryService.getUsersByIds(userIds);

        return finalEntries.stream().map(r -> {
            LeaseTbl lease = unitToLeaseMap.get(r.getUnit().getId());
            String tenantName = "Vacant";
            if (lease != null) {
                UserTbl user = usersMap.get(lease.getUserId());
                if (user != null) {
                    tenantName = user.getFullName();
                } else {
                    tenantName = "Unknown Tenant";
                }
            }
            return MeterReadingResponse.builder()
                    .id(r.getId())
                    .unitId(r.getUnit().getId())
                    .unitName("Apt " + r.getUnit().getUnitNumber())
                    .tenantName(tenantName)
                    .floor(r.getUnit().getFloor())
                    .previousReading(r.getPreviousReading())
                    .currentReading(r.getCurrentReading())
                    .isBilled(r.getIsBilled())
                    .build();
        }).sorted(Comparator.comparing(MeterReadingResponse::getUnitName)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void batchSaveReadings(MeterReadingRequest request) {
        List<UnitReading> readings = request.getReadings();
        if (readings == null || readings.isEmpty()) return;

        // Optimized: Bulk fetch target entries using findByUnitIdIn...
        Set<UUID> unitIds = readings.stream()
                .map(UnitReading::getUnitId)
                .collect(Collectors.toSet());
        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByUnitIdInAndChargeConfigIdAndBillingMonthAndBillingYear(
                unitIds, request.getChargeConfigId(), request.getBillingMonth(), request.getBillingYear());
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(e -> e.getUnit().getId(), e -> e));

        List<MeterReadingTbl> toSave = new ArrayList<>();
        for (UnitReading unitReading : readings) {
            if (unitReading.getCurrentReading() == null) continue;
            
            MeterReadingTbl entry = existingEntriesMap.get(unitReading.getUnitId());
            if (entry == null) {
                throw new BusinessException("Meter reading not initialized for unit " + unitReading.getUnitId());
            }
            
            if (entry.getIsBilled()) {
                continue;
            }
            
            if (unitReading.getPreviousReading() != null) {
                entry.setPreviousReading(unitReading.getPreviousReading());
            }
            
            if (unitReading.getCurrentReading().compareTo(entry.getPreviousReading()) < 0) {
                throw new BusinessException("Current reading cannot be less than previous reading for unit " + entry.getUnit().getUnitNumber());
            }
            
            entry.setCurrentReading(unitReading.getCurrentReading());
            toSave.add(entry);
        }

        // Optimized: Save all in bulk
        if (!toSave.isEmpty()) {
            meterReadingCrudService.saveAll(toSave);
        }
    }
}
