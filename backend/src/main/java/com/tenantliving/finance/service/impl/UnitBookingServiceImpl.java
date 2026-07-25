package com.tenantliving.finance.service.impl;

import com.tenantliving.auth.service.interfaces.AuthorizationService;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.UnitBookingTbl;
import com.tenantliving.finance.dto.UnitBookingDTOs;
import com.tenantliving.finance.service.interfaces.UnitBookingCrudService;
import com.tenantliving.finance.service.interfaces.UnitBookingService;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import com.tenantliving.payment.service.interfaces.PaymentTransactionService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitAvailabilityService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UnitBookingServiceImpl implements UnitBookingService {

    private final UnitBookingCrudService unitBookingCrudService;
    private final UnitQueryService unitQueryService;
    private final UnitAvailabilityService unitAvailabilityService;
    private final PaymentTransactionService paymentTransactionService;
    private final AuthorizationService authorizationService;
    private final UserQueryService userQueryService;

    @Override
    public UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request) {
        log.info("Processing booking creation for unit: {}, tenant name: {}", request.unitId(), request.prospectiveTenantName());

        boolean available = unitAvailabilityService.isUnitAvailableOnDate(request.unitId(), request.expectedMoveInDate());
        if (!available) {
            throw new BusinessException(HttpStatus.CONFLICT, "No vacancy available in this unit on the requested date");
        }

        UnitTbl unit = unitQueryService.getUnitById(request.unitId());

        UnitBookingTbl booking = UnitBookingTbl.builder()
                .unit(unit)
                .prospectiveTenantUserId(request.prospectiveTenantUserId())
                .prospectiveTenantName(request.prospectiveTenantName())
                .prospectiveTenantPhone(request.prospectiveTenantPhone())
                .prospectiveTenantEmail(request.prospectiveTenantEmail())
                .tokenAmount(request.tokenAmount())
                .expectedMoveInDate(request.expectedMoveInDate())
                .status("BOOKED")
                .build();

        booking = unitBookingCrudService.save(booking);
        return toResponse(booking);
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking forfeit for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus("FORFEITED");
        booking = unitBookingCrudService.save(booking);
        return toResponse(booking);
    }

    @Override
    public UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId) {
        log.info("Processing booking refund for ID: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        booking.setStatus("REFUNDED");
        booking = unitBookingCrudService.save(booking);
        return toResponse(booking);
    }

    @Override
    public PaymentTransactionTbl initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId) {
        log.info("Initiating token online payment for booking: {} by user: {}", bookingId, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_CREATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!"BOOKED".equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentTransactionService.initiateOnlinePayment(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                booking.getTokenAmount()
        );
    }

    @Override
    public PaymentTransactionTbl recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId) {
        log.info("Recording token cash payment for booking: {} amount: {} by user: {}", bookingId, amount, userDetailsId);
        UnitBookingTbl booking = getBookingOrThrow(bookingId);

        if (!authorizationService.hasPermissionByUnitId(booking.getUnit().getId(), "LEASE_UPDATE")) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Access Denied");
        }

        if (!"BOOKED".equals(booking.getStatus())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Booking is not in BOOKED status");
        }

        UUID payerUserId = resolvePayerUserId(booking, userDetailsId);

        return paymentTransactionService.recordCashPayment(
                payerUserId,
                "UNIT_BOOKING",
                bookingId,
                amount,
                userDetailsId,
                note
        );
    }

    private UnitBookingTbl getBookingOrThrow(UUID id) {
        return unitBookingCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));
    }

    private UUID resolvePayerUserId(UnitBookingTbl booking, UUID fallbackUserId) {
        UUID payerUserId = booking.getProspectiveTenantUserId();
        if (payerUserId == null) {
            if (booking.getProspectiveTenantEmail() != null) {
                UserTbl u = userQueryService.findByEmail(booking.getProspectiveTenantEmail()).orElse(null);
                if (u != null) {
                    payerUserId = u.getId();
                }
            }
            if (payerUserId == null && booking.getProspectiveTenantPhone() != null) {
                UserTbl u = userQueryService.findByPhoneNumber(booking.getProspectiveTenantPhone()).orElse(null);
                if (u != null) {
                    payerUserId = u.getId();
                }
            }
        }
        return payerUserId != null ? payerUserId : fallbackUserId;
    }

    private UnitBookingDTOs.UnitBookingResponse toResponse(UnitBookingTbl booking) {
        return new UnitBookingDTOs.UnitBookingResponse(
                booking.getId(),
                booking.getUnit().getId(),
                booking.getUnit().getUnitNumber(),
                booking.getProspectiveTenantUserId(),
                booking.getProspectiveTenantName(),
                booking.getProspectiveTenantPhone(),
                booking.getProspectiveTenantEmail(),
                booking.getTokenAmount(),
                booking.getExpectedMoveInDate(),
                booking.getStatus(),
                booking.getPaymentTransaction() != null ? booking.getPaymentTransaction().getId() : null,
                booking.getConvertedLeaseId(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<UnitBookingDTOs.UnitBookingResponse> listBookings() {
        return unitBookingCrudService.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
