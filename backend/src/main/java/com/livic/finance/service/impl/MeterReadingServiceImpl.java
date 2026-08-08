package com.livic.finance.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.MeterReadingTbl;
import com.livic.finance.dto.MeterReadingDTOs.*;
import com.livic.finance.service.MeterReadingService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.MeterReadingCrudService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.domain.UnitTbl;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.property.facade.UnitFacade;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
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
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final PropertyFacade propertyFacade;
    private final UnitFacade unitFacade;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public List<MeterReadingResponse> getOrCreateWorksheet(UUID propertyId, UUID chargeConfigId, Integer month, Integer year) {
        PropertySummaryDTO property = propertyFacade.getPropertyById(propertyId)
                .orElseThrow(() -> new BusinessException("Property not found"));
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        if (!"METERED".equals(chargeConfig.getCalculationStrategy().name())) {
            throw new BusinessException("Charge config is not a metered strategy");
        }

        List<UnitSummaryDTO> units = unitFacade.getUnitsByPropertyId(propertyId);
        List<LeaseTbl> activeLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, LeaseTbl> unitToLeaseMap = activeLeases.stream()
                .collect(Collectors.toMap(l -> l.getUnit().getId(), l -> l, (existing, replacement) -> existing));

        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, month, year);
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        int previousMonth = month == 1 ? 12 : month - 1;
        int previousYear = month == 1 ? year - 1 : year;
        List<MeterReadingTbl> previousReadings = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, previousMonth, previousYear);
        Map<UUID, BigDecimal> previousReadingsMap = previousReadings.stream()
                .filter(r -> r.getCurrentReading() != null)
                .collect(Collectors.toMap(r -> r.getUnit().getId(), MeterReadingTbl::getCurrentReading));

        List<MeterReadingTbl> finalEntries = new ArrayList<>();
        List<MeterReadingTbl> newEntriesToSave = new ArrayList<>();

        for (UnitSummaryDTO unitSummary : units) {
            if (!unitToLeaseMap.containsKey(unitSummary.id())) {
                continue;
            }

            MeterReadingTbl entry = existingEntriesMap.get(unitSummary.id());
            if (entry == null) {
                BigDecimal previousReading = previousReadingsMap.get(unitSummary.id());
                if (previousReading == null) {
                    if (chargeConfig.getBaseRate() != null) {
                        previousReading = chargeConfig.getBaseRate();
                    } else {
                        previousReading = BigDecimal.ZERO;
                    }
                }

                PropertyTbl propertyRef = new PropertyTbl();
                propertyRef.setId(property.id());

                UnitTbl unitRef = new UnitTbl();
                unitRef.setId(unitSummary.id());

                entry = MeterReadingTbl.builder()
                        .property(propertyRef)
                        .unit(unitRef)
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

        if (!newEntriesToSave.isEmpty()) {
            finalEntries.addAll(meterReadingCrudService.saveAll(newEntriesToSave));
        }

        Set<UUID> userIds = activeLeases.stream().map(LeaseTbl::getUserId).collect(Collectors.toSet());
        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(userIds);

        return finalEntries.stream().map(r -> {
            LeaseTbl lease = unitToLeaseMap.get(r.getUnit().getId());
            String tenantName = "Vacant";
            if (lease != null) {
                UserSummaryDTO user = usersMap.get(lease.getUserId());
                if (user != null) {
                    tenantName = user.fullName();
                } else {
                    tenantName = "Unknown Tenant";
                }
            }

            return MeterReadingResponse.builder()
                    .id(r.getId())
                    .unitId(r.getUnit().getId())
                    .unitName(r.getUnit().getUnitNumber())
                    .tenantName(tenantName)
                    .previousReading(r.getPreviousReading())
                    .currentReading(r.getCurrentReading())
                    .isBilled(r.getIsBilled())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void batchSaveReadings(MeterReadingRequest request) {
        List<MeterReadingTbl> existingEntries = meterReadingCrudService.findByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                request.getPropertyId(), request.getChargeConfigId(), request.getBillingMonth(), request.getBillingYear());
        Map<UUID, MeterReadingTbl> existingEntriesMap = existingEntries.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        for (UnitReading entryReq : request.getReadings()) {
            MeterReadingTbl entry = existingEntriesMap.get(entryReq.getUnitId());
            if (entry != null && !Boolean.TRUE.equals(entry.getIsBilled())) {
                entry.setCurrentReading(entryReq.getCurrentReading());
                meterReadingCrudService.save(entry);
            }
        }
    }
}
