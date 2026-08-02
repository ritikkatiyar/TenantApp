package com.livic.finance.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.BillingWorksheetEntryTbl;
import com.livic.finance.domain.ChargeConfigTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.dto.BillingWorksheetDTOs.*;
import com.livic.finance.service.BillingWorksheetService;
import com.livic.finance.service.interfaces.BillingWorksheetCrudService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.domain.UnitTbl;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.PropertyFacade;
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
    private final PropertyFacade propertyFacade;
    private final LeaseCrudService leaseCrudService;
    private final ChargeConfigCrudService chargeConfigCrudService;
    private final RentCycleCrudService rentCycleCrudService;

    @Override
    @Transactional
    public List<WorksheetEntryResponse> getOrCreateWorksheetForMonth(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        ChargeConfigTbl chargeConfig = chargeConfigCrudService.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        List<UnitSummaryDTO> units = propertyFacade.getUnitsByPropertyId(propertyId);
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

        for (UnitSummaryDTO unitSummary : units) {
            if (!unitToLeasesMap.containsKey(unitSummary.id())) {
                continue;
            }

            BillingWorksheetEntryTbl entry = existingEntriesMap.get(unitSummary.id());
            if (entry == null) {
                BigDecimal initialValue = BigDecimal.ZERO;
                if (Boolean.TRUE.equals(chargeConfig.getAutoCarryForward())) {
                    initialValue = carryForwardValues.getOrDefault(unitSummary.id(), BigDecimal.ZERO);
                } else if (chargeConfig.getBaseRate() != null) {
                    initialValue = chargeConfig.getBaseRate();
                }

                PropertyTbl property = new PropertyTbl();
                property.setId(propertyId);

                UnitTbl unit = new UnitTbl();
                unit.setId(unitSummary.id());

                entry = BillingWorksheetEntryTbl.builder()
                        .property(property)
                        .unit(unit)
                        .chargeConfig(chargeConfig)
                        .billingMonth(billingMonth)
                        .enteredValue(initialValue)
                        .createdBy(authUserId != null ? authUserId : UUID.randomUUID())
                        .build();
                toSave.add(entry);
            }
            finalEntries.add(entry);
        }

        if (!toSave.isEmpty()) {
            billingWorksheetCrudService.saveAll(toSave);
        }

        return finalEntries.stream()
                .map(entry -> WorksheetEntryResponse.builder()
                        .id(entry.getId())
                        .unitId(entry.getUnit().getId())
                        .unitName(entry.getUnit().getUnitNumber())
                        .enteredValue(entry.getEnteredValue())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveWorksheet(WorksheetSaveRequest request) {
        List<RentCycleTbl> rentCycles = rentCycleCrudService.findByPropertyIdAndBillingMonth(
                request.getPropertyId(), request.getBillingMonth());

        boolean isLocked = rentCycles.stream().anyMatch(rc ->
                rc.getStatus() == RentCycleStatus.PUBLISHED ||
                        rc.getStatus() == RentCycleStatus.PAID ||
                        rc.getStatus() == RentCycleStatus.PARTIALLY_PAID
        );

        if (isLocked) {
            throw new BusinessException("Cannot update worksheet entries because rent bills for this month have already been published or paid");
        }

        List<BillingWorksheetEntryTbl> existing = billingWorksheetCrudService.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
                request.getPropertyId(), request.getChargeConfigId(), request.getBillingMonth());
        Map<UUID, BillingWorksheetEntryTbl> entryMap = existing.stream()
                .collect(Collectors.toMap(e -> e.getUnit().getId(), e -> e));

        for (UnitEntry item : request.getEntries()) {
            BillingWorksheetEntryTbl entry = entryMap.get(item.getUnitId());
            if (entry != null) {
                entry.setEnteredValue(item.getEnteredValue());
                billingWorksheetCrudService.save(entry);
            }
        }
    }
}
