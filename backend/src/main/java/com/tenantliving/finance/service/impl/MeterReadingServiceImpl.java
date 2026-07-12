package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ChargeConfigTbl;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.domain.MeterReadingTbl;
import com.tenantliving.finance.dto.MeterReadingDTOs.*;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.repository.MeterReadingRepository;
import com.tenantliving.finance.service.MeterReadingService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
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

    private final MeterReadingRepository meterReadingRepository;
    private final UnitQueryService unitQueryService;
    private final LeaseRepository leaseRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyQueryService propertyQueryService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        ChargeConfigTbl chargeConfig = chargeConfigRepository.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        if (!"METERED".equals(chargeConfig.getCalculationStrategy().name())) {
            throw new BusinessException("Charge config is not a metered strategy");
        }

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, LeaseTbl> unitToLeaseMap = activeLeases.stream()
                .collect(Collectors.toMap(l -> l.getUnit().getId(), l -> l, (existing, replacement) -> existing));

        List<MeterReadingTbl> existingEntries = meterReadingRepository.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, month, year);
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        List<MeterReadingTbl> finalEntries = new ArrayList<>();

        for (UnitTbl unit : units) {
            MeterReadingTbl entry = existingEntriesMap.get(unit.getId());
            if (entry == null) {
                // Fetch previous reading
                BigDecimal previousReading = BigDecimal.ZERO;
                int previousMonth = month == 1 ? 12 : month - 1;
                int previousYear = month == 1 ? year - 1 : year;
                
                Optional<MeterReadingTbl> lastEntry = meterReadingRepository.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                        unit.getId(), chargeConfigId, previousMonth, previousYear);
                        
                if (lastEntry.isPresent() && lastEntry.get().getCurrentReading() != null) {
                    previousReading = lastEntry.get().getCurrentReading();
                } else {
                    // Fallback to absolute latest
                    Optional<MeterReadingTbl> absoluteLast = meterReadingRepository.findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(unit.getId(), chargeConfigId);
                    if (absoluteLast.isPresent() && absoluteLast.get().getCurrentReading() != null) {
                        previousReading = absoluteLast.get().getCurrentReading();
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
                entry = meterReadingRepository.save(entry);
            }
            finalEntries.add(entry);
        }

        return finalEntries.stream().map(r -> {
            LeaseTbl lease = unitToLeaseMap.get(r.getUnit().getId());
            String tenantName = "Vacant";
            if (lease != null) {
                try {
                    UserTbl user = userQueryService.getUserById(lease.getUserId());
                    tenantName = user.getFullName();
                } catch (Exception e) {
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
        for (UnitReading unitReading : request.getReadings()) {
            if (unitReading.getCurrentReading() == null) continue;
            
            MeterReadingTbl entry = meterReadingRepository.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                    unitReading.getUnitId(), request.getChargeConfigId(), request.getBillingMonth(), request.getBillingYear())
                    .orElseThrow(() -> new BusinessException("Meter reading not initialized for unit " + unitReading.getUnitId()));
            
            if (entry.getIsBilled()) {
                continue;
            }
            
            if (unitReading.getPreviousReading() != null) {
                entry.setPreviousReading(unitReading.getPreviousReading());
            }
            
            // Validate that current reading is >= previous reading
            if (unitReading.getCurrentReading().compareTo(entry.getPreviousReading()) < 0) {
                throw new BusinessException("Current reading cannot be less than previous reading for unit " + entry.getUnit().getUnitNumber());
            }
            
            entry.setCurrentReading(unitReading.getCurrentReading());
            meterReadingRepository.save(entry);
        }
    }
}
