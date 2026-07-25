package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.auth.service.interfaces.MembershipService;

import com.tenantliving.finance.service.interfaces.LeaseCrudService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tenantliving.property.service.interfaces.UnitAvailabilityService;
import com.tenantliving.finance.domain.UnitBookingTbl;
import com.tenantliving.finance.service.interfaces.UnitBookingCrudService;
import com.tenantliving.finance.service.interfaces.FinanceLedgerCrudService;
import com.tenantliving.finance.domain.FinanceLedgerTbl;
import com.tenantliving.common.domain.LedgerTransactionType;
import com.tenantliving.user.service.interfaces.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LeaseServiceImpl implements LeaseService {

    private final LeaseCrudService leaseCrudService;
    private final UnitQueryService unitQueryService;
    private final UserQueryService userQueryService;
    private final MembershipService membershipService;
    private final UnitBookingCrudService unitBookingCrudService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final UnitAvailabilityService unitAvailabilityService;
    private final FinanceLedgerCrudService financeLedgerCrudService;

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request) {
        return createLease(request, null);
    }

    @Override
    public LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId) {
        // 1. Dynamic unit availability safety check
        boolean available = unitAvailabilityService.isUnitAvailableOnDate(request.unitId(), request.moveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "Unit capacity has been reached for the selected move-in date");
        }

        UnitTbl unit = unitQueryService.getUnitById(request.unitId());
        
        if (request.moveOutDate() != null && request.moveOutDate().isBefore(request.moveInDate())) {
            throw new BusinessException("moveOutDate cannot be before moveInDate");
        }

        UnitBookingTbl booking = null;
        UUID targetUserId = request.userId();

        // 2. Process booking conversion and auto-register prospective tenant if needed
        if (request.bookingId() != null) {
            booking = unitBookingCrudService.findById(request.bookingId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));

            if (!"BOOKED".equals(booking.getStatus())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
            }
            if (booking.getPaymentTransaction() == null) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Token payment has not been collected for this booking");
            }

            if (targetUserId == null) {
                // Check if user already exists
                UserTbl existingUser = null;
                if (booking.getProspectiveTenantEmail() != null) {
                    existingUser = userQueryService.findByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                }
                if (existingUser == null && booking.getProspectiveTenantPhone() != null) {
                    existingUser = userQueryService.findByPhoneNumber(booking.getProspectiveTenantPhone()).orElse(null);
                }

                if (existingUser != null) {
                    targetUserId = existingUser.getId();
                } else {
                    // Create prospective tenant account dynamically
                    String email = booking.getProspectiveTenantEmail();
                    if (email == null || email.isBlank()) {
                        email = "tenant_" + booking.getProspectiveTenantPhone() + "@tenantliving.com";
                    }
                    UserTbl newUser = UserTbl.builder()
                            .authUid(email.trim().toLowerCase())
                            .fullName(booking.getProspectiveTenantName().trim())
                            .phoneNumber(booking.getProspectiveTenantPhone().trim())
                            .passwordHash(passwordEncoder.encode(booking.getProspectiveTenantPhone().trim()))
                            .globalRole(com.tenantliving.common.domain.UserRole.USER)
                            .build();

                    newUser = userService.createUser(newUser);
                    targetUserId = newUser.getId();
                }
            }
        }

        if (targetUserId == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "User ID is required for lease creation when no booking is converted");
        }

        UserTbl tenant = userQueryService.getUserById(targetUserId);
        membershipService.ensureTenantRole(tenant.getId(), unit.getProperty().getId(), assignedByUserId);

        LeaseTbl lease = LeaseTbl.builder()
                .userId(targetUserId)
                .unit(unit)
                .securityDeposit(request.securityDeposit())
                .splitStrategy(request.splitStrategy())
                .moveInDate(request.moveInDate())
                .moveOutDate(request.moveOutDate())
                .status(request.status() != null ? request.status() : LeaseStatus.ACTIVE)
                .build();
        LeaseTbl saved = leaseCrudService.save(lease);

        // 3. Mark booking as converted
        if (booking != null) {
            booking.setStatus("CONVERTED");
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
    public void deleteLease(UUID id) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        UUID tenantId = lease.getUserId();
        UUID propertyId = lease.getUnit().getProperty().getId();

        leaseCrudService.delete(lease);

        // Check if this tenant has any other active leases in any unit of the same property
        boolean hasOtherLeases = leaseCrudService.existsByUserIdAndPropertyIdAndStatus(
                tenantId, propertyId, LeaseStatus.ACTIVE
        );

        if (!hasOtherLeases) {
            membershipService.removeTenantRole(tenantId, propertyId);
        }
    }

    @Override
    public LeaseTbl updateNoticePeriod(UUID id, java.time.LocalDate moveOutDate) {
        LeaseTbl lease = leaseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Lease not found"));
        lease.setMoveOutDate(moveOutDate);
        return leaseCrudService.save(lease);
    }
}
