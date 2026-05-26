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
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.property.repository.UnitRepository;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
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
    private final UnitRepository unitRepository;
    private final LeaseRepository leaseRepository;
    private final ChargeConfigRepository chargeConfigRepository;
    private final PropertyRepository propertyRepository;
    private final UserService userService;

    @Override
    @Transactional
    public List<MeterReadingResponse> getOrCreateMeterReadingsForMonth(UUID propertyId, UUID chargeConfigId, Integer month, Integer year) {
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new BusinessException("Property not found"));
        ChargeConfigTbl chargeConfig = chargeConfigRepository.findById(chargeConfigId)
                .orElseThrow(() -> new BusinessException("Charge config not found"));

        List<UnitTbl> units = unitRepository.findByPropertyId(propertyId);
        List<LeaseTbl> activeLeases = leaseRepository.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, LeaseTbl> unitToLeaseMap = activeLeases.stream()
                .collect(Collectors.toMap(l -> l.getUnit().getId(), l -> l, (existing, replacement) -> existing));

        List<MeterReadingTbl> existingReadings = meterReadingRepository.findAllByPropertyIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                propertyId, chargeConfigId, month, year);
        Map<UUID, MeterReadingTbl> existingReadingsMap = existingReadings.stream()
                .collect(Collectors.toMap(r -> r.getUnit().getId(), r -> r));

        List<MeterReadingTbl> finalReadings = new ArrayList<>();

        for (UnitTbl unit : units) {
            MeterReadingTbl reading = existingReadingsMap.get(unit.getId());
            if (reading == null) {
                // Find previous month's reading to intelligently carry over
                BigDecimal prevReadingVal = BigDecimal.ZERO;
                Optional<MeterReadingTbl> lastReading = meterReadingRepository.findTopByUnitIdAndChargeConfigIdOrderByBillingYearDescBillingMonthDesc(unit.getId(), chargeConfigId);
                if (lastReading.isPresent() && lastReading.get().getCurrentReading() != null) {
                    prevReadingVal = lastReading.get().getCurrentReading();
                }

                reading = MeterReadingTbl.builder()
                        .property(property)
                        .unit(unit)
                        .chargeConfig(chargeConfig)
                        .billingMonth(month)
                        .billingYear(year)
                        .previousReading(prevReadingVal)
                        .isBilled(false)
                        .build();
                reading = meterReadingRepository.save(reading);
            }
            finalReadings.add(reading);
        }

        return finalReadings.stream().map(r -> {
            LeaseTbl lease = unitToLeaseMap.get(r.getUnit().getId());
            String tenantName = "Vacant";
            if (lease != null) {
                try {
                    UserTbl user = userService.getUserById(lease.getUserId());
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
    public void saveMeterReadings(MeterReadingRequest request) {
        for (UnitReading unitReading : request.getReadings()) {
            if (unitReading.getCurrentReading() == null) continue;
            
            MeterReadingTbl reading = meterReadingRepository.findByUnitIdAndChargeConfigIdAndBillingMonthAndBillingYear(
                    unitReading.getUnitId(), request.getChargeConfigId(), request.getBillingMonth(), request.getBillingYear())
                    .orElseThrow(() -> new BusinessException("Reading not initialized for unit " + unitReading.getUnitId()));
            
            if (reading.getIsBilled()) {
                continue; // Skip if this meter reading has already been processed into a locked invoice
            }
            reading.setCurrentReading(unitReading.getCurrentReading());
            meterReadingRepository.save(reading);
        }
    }
}
