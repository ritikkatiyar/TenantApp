package com.tenantliving.rentcycle.service.impl;

import com.tenantliving.common.domain.RentChargeType;
import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.lease.domain.LeaseTbl;
import com.tenantliving.lease.service.interfaces.LeaseService;
import com.tenantliving.rentcycle.domain.RentCycleChargeTbl;
import com.tenantliving.rentcycle.domain.RentCycleTbl;
import com.tenantliving.rentcycle.dto.RentCycleDTOs;
import com.tenantliving.rentcycle.mapper.RentCycleMapper;
import com.tenantliving.rentcycle.repository.RentCycleChargeRepository;
import com.tenantliving.rentcycle.repository.RentCycleRepository;
import com.tenantliving.rentcycle.service.interfaces.RentCycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RentCycleServiceImpl implements RentCycleService {

    private final RentCycleRepository rentCycleRepository;
    private final RentCycleChargeRepository rentCycleChargeRepository;
    private final LeaseService leaseService;

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request) {
        if (rentCycleRepository.findByLease_IdAndBillingMonth(request.leaseId(), request.billingMonth()).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Rent cycle already exists for this lease and billing month");
        }

        LeaseTbl lease = leaseService.getLeaseById(request.leaseId());
        BigDecimal baseAmount = lease.getRentAmount();
        BigDecimal totalAmount = baseAmount.add(extraChargesTotal(request.charges()));

        RentCycleTbl cycle = RentCycleTbl.builder()
                .lease(lease)
                .billingMonth(request.billingMonth())
                .baseAmount(baseAmount)
                .totalAmount(totalAmount)
                .dueDate(request.dueDate())
                .status(RentCycleStatus.PENDING)
                .build();
        RentCycleTbl savedCycle = rentCycleRepository.save(cycle);

        rentCycleChargeRepository.save(RentCycleChargeTbl.builder()
                .rentCycle(savedCycle)
                .chargeType(RentChargeType.BASE_RENT)
                .amount(baseAmount)
                .description("Owner-level base rent")
                .build());

        if (request.charges() != null) {
            request.charges().forEach(charge -> rentCycleChargeRepository.save(RentCycleChargeTbl.builder()
                    .rentCycle(savedCycle)
                    .chargeType(charge.chargeType())
                    .amount(charge.amount())
                    .description(charge.description())
                    .build()));
        }

        log.info("rent_cycle_generated rentCycleId={} leaseId={} billingMonth={} totalAmount={}",
                savedCycle.getId(), lease.getId(), savedCycle.getBillingMonth(), savedCycle.getTotalAmount());
        return toResponse(savedCycle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RentCycleDTOs.RentCycleResponse> list(UUID leaseId, String billingMonth, RentCycleStatus status) {
        List<RentCycleTbl> cycles;
        if (leaseId != null) {
            cycles = rentCycleRepository.findByLease_Id(leaseId);
        } else if (billingMonth != null) {
            cycles = rentCycleRepository.findByBillingMonth(billingMonth);
        } else {
            cycles = rentCycleRepository.findAll();
        }

        return cycles.stream()
                .filter(cycle -> billingMonth == null || billingMonth.equals(cycle.getBillingMonth()))
                .filter(cycle -> status == null || status == cycle.getStatus())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RentCycleDTOs.RentCycleResponse markPaid(UUID id) {
        RentCycleTbl cycle = rentCycleRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));
        cycle.setStatus(RentCycleStatus.PAID);
        cycle.setPaidAt(LocalDateTime.now());
        RentCycleTbl saved = rentCycleRepository.save(cycle);
        log.info("rent_cycle_marked_paid rentCycleId={} leaseId={} paidAt={}",
                saved.getId(), saved.getLease().getId(), saved.getPaidAt());
        return toResponse(saved);
    }

    private BigDecimal extraChargesTotal(List<RentCycleDTOs.ChargeRequest> charges) {
        if (charges == null) {
            return BigDecimal.ZERO;
        }
        return charges.stream()
                .map(RentCycleDTOs.ChargeRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private RentCycleDTOs.RentCycleResponse toResponse(RentCycleTbl cycle) {
        return RentCycleMapper.toResponse(cycle, rentCycleChargeRepository.findByRentCycle_Id(cycle.getId()));
    }
}
