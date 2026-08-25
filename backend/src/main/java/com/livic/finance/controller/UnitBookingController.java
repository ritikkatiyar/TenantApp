package com.livic.finance.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.finance.service.interfaces.UnitBookingService;
import com.livic.payment.dto.PaymentTransactionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/unit-bookings")
@RequiredArgsConstructor
@Slf4j
public class UnitBookingController {

    private final UnitBookingService unitBookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UnitBookingDTOs.UnitBookingResponse>>> listBookings(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId
    ) {
        log.info("API request: List unit bookings for propertyId: {}", propertyId);
        UUID currentUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.listBookings(currentUserId, propertyId)));
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
        return ResponseEntity.ok(ApiResponse.success(unitBookingService.initiateTokenOnlinePayment(id, callerUserId)));
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

        return ResponseEntity.ok(ApiResponse.success(unitBookingService.recordTokenCashPayment(id, amount, note, callerUserId)));
    }
}
