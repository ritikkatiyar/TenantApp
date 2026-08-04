package com.livic.finance.service.impl;

import com.livic.auth.facade.AuthFacade;
import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.LedgerTransactionType;
import com.livic.common.domain.UnitBookingStatus;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.FinanceLedgerTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.UnitBookingTbl;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.finance.mapper.LeaseMapper;
import com.livic.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.finance.service.interfaces.LeaseCrudService;
import com.livic.finance.service.interfaces.LeaseService;
import com.livic.finance.service.interfaces.UnitBookingCrudService;
import com.livic.property.domain.UnitTbl;
import com.livic.property.facade.PropertyFacade;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.livic.property.dto.UnitSummaryDTO;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaseServiceImpl implements LeaseService {

    private final LeaseCrudService leaseCrudService;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;
    private final AuthFacade authFacade;
    private final UnitBookingCrudService unitBookingCrudService;
    private final FinanceLedgerCrudService financeLedgerCrudService;

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        // 1. Dynamic unit availability safety check
        boolean available = propertyFacade.isUnitAvailableOnDate(request.unitId(), request.moveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "Unit capacity has been reached for the selected move-in date");
        }

        UnitSummaryDTO unitSummary = propertyFacade.getUnitById(request.unitId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit not found"));
        UnitTbl unit = new UnitTbl();
        unit.setId(unitSummary.id());
        
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }

        UnitBookingTbl booking = null;
        UUID targetUserId = request.userId();

        // 2. Process booking conversion and auto-register prospective tenant if needed
        if (request.bookingId() != null) {
            booking = unitBookingCrudService.findById(request.bookingId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));

            if (!UnitBookingStatus.BOOKED.name().equals(booking.getStatus())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
            }
            if (booking.getPaymentTransaction() == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Token payment has not been collected for this booking");
            }

            if (targetUserId == null) {
                // Check if user already exists
                UserSummaryDTO existingUser = null;
                if (booking.getProspectiveTenantEmail() != null) {
                    existingUser = userFacade.getUserByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                }

                if (existingUser != null) {
                    targetUserId = existingUser.id();
                } else {
                    // Create prospective tenant account dynamically
                    String email = booking.getProspectiveTenantEmail();
                    if (email == null || email.isBlank()) {
                        email = "tenant_" + booking.getProspectiveTenantPhone() + "@tenantliving.com";
                    }
                    UserSummaryDTO createdUser = userFacade.createUser(
                            email,
                            booking.getProspectiveTenantName(),
                            booking.getProspectiveTenantPhone(),
                            booking.getProspectiveTenantPhone()
                    );
                    targetUserId = createdUser.id();
                }
            }
        }

        if (targetUserId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "User ID is required for lease creation when no booking is converted");
        }

        UserSummaryDTO tenant = userFacade.getUserById(targetUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        authFacade.ensureTenantRole(tenant.id(), unitSummary.propertyId(), assignedByUserId);

        LeaseTbl lease = LeaseMapper.toEntity(request, unit, targetUserId);
        LeaseTbl saved = leaseCrudService.save(lease);

        // 3. Mark booking as converted
        if (booking != null) {
            booking.setStatus(UnitBookingStatus.CONVERTED.name());
            booking.setConvertedLeaseId(saved.getId());
            unitBookingCrudService.save(booking);
        }

        // 4. Log Security Deposit Billing DEBIT in ledger
        BigDecimal currentBalance = financeLedgerCrudService.sumAmountByLeaseId(saved.getId());
        BigDecimal newBalance = currentBalance.add(request.securityDeposit());

        FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unit(unit)
                .lease(saved)
                .transactionType(LedgerTransactionType.INVOICE_GENERATED)
                .amount(request.securityDeposit())
                .balance(newBalance)
                .referenceId(saved.getId())
                .description("Security Deposit Invoice")
                .build();
        financeLedgerCrudService.save(ledgerEntry);

        log.info("lease_created leaseId={} userId={} unitId={} status={}",
                saved.getId(), saved.getUserId(), saved.getUnit().getId(), saved.getStatus());
        return saved;
    }

    @Override
    public LeaseDTOs.LeaseResponse terminateLease(UUID id) {
        LeaseTbl lease = leaseCrudService.findWithUnitAndPropertyById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));

        lease.setStatus(LeaseStatus.ENDED);
        if (lease.getMoveOutDate() == null) {
            lease.setMoveOutDate(LocalDate.now());
        }
        LeaseTbl saved = leaseCrudService.save(lease);

        UUID tenantId = saved.getUserId();
        UUID propertyId = saved.getUnit().getProperty().getId();

        // Check if this tenant has any other active leases in any unit of the same property
        boolean hasOtherLeases = leaseCrudService.existsByUserIdAndPropertyIdAndStatus(
                tenantId, propertyId, LeaseStatus.ACTIVE
        );

        if (!hasOtherLeases) {
            authFacade.removeTenantRole(tenantId, propertyId);
        }

        // Map to DTO — entity must not cross the service boundary.
        // tenantName/tenantPhone are intentionally omitted here;
        // the orchestration layer enriches them via UserFacade.
        return LeaseMapper.toResponse(saved);
    }

    @Override
    public LeaseTbl updateNoticePeriod(UUID id, java.time.LocalDate moveOutDate) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        lease.setMoveOutDate(moveOutDate);
        return leaseCrudService.save(lease);
    }
}
