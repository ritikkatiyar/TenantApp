package com.livic.property.service.impl;

import com.livic.common.exception.BusinessException;
import com.livic.finance.facade.FinanceFacade;
import com.livic.property.domain.UnitTbl;
import com.livic.property.service.interfaces.UnitAvailabilityService;
import com.livic.property.service.interfaces.UnitCrudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UnitAvailabilityServiceImpl implements UnitAvailabilityService {

    private final UnitCrudService unitCrudService;
    private final FinanceFacade financeFacade;

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, LocalDate date) {
        log.info("Checking availability for Unit: {} on date: {}", unitId, date);

        UnitTbl unit = unitCrudService.findById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));

        boolean isOccupied = financeFacade.isUnitOccupiedOnDate(unitId, date);

        log.info("Unit: {} has capacity: {}, occupied on {}: {}", unitId, unit.getCapacity(), date, isOccupied);
        return !isOccupied;
    }
}
