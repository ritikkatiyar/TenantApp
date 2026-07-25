package com.tenantliving.finance.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.UnitBookingDTOs;
import com.tenantliving.finance.service.interfaces.UnitBookingService;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import com.tenantliving.payment.dto.PaymentTransactionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/unit-bookings")
@RequiredArgsConstructor
@Slf4j
public class UnitBookingController {

    private final UnitBookingService unitBookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<UnitBookingDTOs.UnitBookingResponse>>> listBookings() {
        log.info("API request: List unit bookings");
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.listBookings()));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId(), 'LEASE_CREATE')")
    public ResponseEntity<ApiResponse<UnitBookingDTOs.UnitBookingResponse>> createBooking(
            @Valid @RequestBody UnitBookingDTOs.CreateBookingRequest request
    ) {
        log.info("API request: Create unit booking");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(unitBookingService.createBooking(request)));
    }

    @PostMapping("/{id}/forfeit")
    public ResponseEntity<ApiResponse<UnitBookingDTOs.UnitBookingResponse>> forfeitBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Forfeit unit booking ID: {}", id);
        UUID callerUserId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.forfeitBooking(id, callerUserId)));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<ApiResponse<UnitBookingDTOs.UnitBookingResponse>> refundBooking(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Refund unit booking ID: {}", id);
        UUID callerUserId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.refundBooking(id, callerUserId)));
    }

    @PostMapping("/{id}/token-payment/online")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> initiateTokenOnlinePayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Initiate online token payment for booking ID: {}", id);
        UUID callerUserId = UUID.fromString(userDetails.getId());
        PaymentTransactionTbl tx = unitBookingService.initiateTokenOnlinePayment(id, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(toResponse(tx)));
    }

    @PostMapping("/{id}/token-payment/cash")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> recordTokenCashPayment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Record cash token payment for booking ID: {}", id);
        UUID callerUserId = UUID.fromString(userDetails.getId());
        
        Object amountObj = request.get("amount");
        BigDecimal amount = amountObj != null ? new BigDecimal(amountObj.toString()) : BigDecimal.ZERO;
        String note = (String) request.get("note");

        PaymentTransactionTbl tx = unitBookingService.recordTokenCashPayment(id, amount, note, callerUserId);
        return ResponseEntity.ok(ApiResponse.success(toResponse(tx)));
    }

    private PaymentTransactionResponse toResponse(PaymentTransactionTbl tx) {
        return new PaymentTransactionResponse(
                tx.getId(),
                tx.getPayerUserId(),
                tx.getPaymentMethod(),
                tx.getReferenceType(),
                tx.getReferenceId(),
                tx.getGatewayName(),
                tx.getGatewayTransactionId(),
                tx.getAmount(),
                tx.getStatus(),
                tx.getConfirmedBy(),
                tx.getConfirmedAt(),
                tx.getNote(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}
