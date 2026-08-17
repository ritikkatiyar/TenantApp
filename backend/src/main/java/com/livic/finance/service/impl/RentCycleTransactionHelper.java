package com.livic.finance.service.impl;

import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.finance.service.interfaces.RentCycleService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Dedicated helper component providing {@code REQUIRES_NEW} transactional boundaries
 * for batch operations. Uses strict constructor injection with {@link Lazy} to avoid circular
 * references and comply with the project's constructor-injection-only rule.
 */
@Service
public class RentCycleTransactionHelper {

    private final RentCycleService rentCycleService;

    public RentCycleTransactionHelper(@Lazy RentCycleService rentCycleService) {
        this.rentCycleService = rentCycleService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleTbl generateSingleInTransaction(LeaseTbl lease, String billingMonth, LocalDate dueDate, Map<UUID, Integer> roommateCounts) {
        return rentCycleService.generateSingleInTransaction(lease, billingMonth, dueDate, roommateCounts);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse publishSingleInTransaction(UUID id) {
        return rentCycleService.publish(id);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public RentCycleDTOs.RentCycleResponse unpublishSingleInTransaction(UUID id) {
        return rentCycleService.unpublish(id);
    }
}
