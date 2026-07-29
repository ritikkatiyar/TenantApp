package com.livic.property.service.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.repository.LeaseRepository;
import com.livic.property.domain.UnitTbl;
import com.livic.property.repository.UnitRepository;
import com.livic.property.service.interfaces.UnitAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UnitAvailabilityServiceImpl implements UnitAvailabilityService {

    private final UnitRepository unitRepository;
    private final LeaseRepository leaseRepository;

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, LocalDate date) {
        log.info("Checking availability for Unit: {} on date: {}", unitId, date);

        UnitTbl unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));

        List<LeaseTbl> activeLeases = leaseRepository.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);

        long activeOccupants = activeLeases.stream()
                .filter(lease -> {
                    boolean hasMovedIn = !date.isBefore(lease.getMoveInDate());
                    boolean hasNotMovedOut = lease.getMoveOutDate() == null || date.isBefore(lease.getMoveOutDate());
                    return hasMovedIn && hasNotMovedOut;
                })
                .count();

        log.info("Unit: {} has capacity: {}, active occupants on {}: {}", unitId, unit.getCapacity(), date, activeOccupants);
        return activeOccupants < unit.getCapacity();
    }
}
