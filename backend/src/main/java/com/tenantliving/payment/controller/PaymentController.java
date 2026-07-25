package com.tenantliving.payment.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.domain.RentCycleTbl;
import com.tenantliving.finance.service.interfaces.RentCycleCrudService;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import com.tenantliving.payment.dto.PaymentTransactionResponse;
import com.tenantliving.payment.service.interfaces.PaymentTransactionService;
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
@RequestMapping("/api/v1/finance/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentTransactionService paymentTransactionService;
    private final RentCycleCrudService rentCycleCrudService;

    @PostMapping("/rent-cycles/{rentCycleId}/online")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> initiateRentOnlinePayment(
            @PathVariable UUID rentCycleId
    ) {
        log.info("API request: Initiate online payment for RentCycle: {}", rentCycleId);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        BigDecimal amountPaid = rentCycle.getAmountPaid() != null ? rentCycle.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingAmount = rentCycle.getTotalAmount().subtract(amountPaid);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Rent cycle is already fully paid");
        }

        UUID payerUserId = rentCycle.getLease().getUserId();

        PaymentTransactionTbl transaction = paymentTransactionService.initiateOnlinePayment(
                payerUserId,
                "RENT_CYCLE",
                rentCycleId,
                remainingAmount
        );

        return ResponseEntity.ok(ApiResponse.success(toResponse(transaction)));
    }

    @PostMapping("/rent-cycles/{rentCycleId}/cash")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<PaymentTransactionResponse>> recordRentCashPayment(
            @PathVariable UUID rentCycleId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Record cash payment for RentCycle: {}", rentCycleId);
        RentCycleTbl rentCycle = rentCycleCrudService.findById(rentCycleId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        Object amountObj = request.get("amount");
        if (amountObj == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Amount is required");
        }

        BigDecimal amount = new BigDecimal(amountObj.toString());
        String note = (String) request.get("note");
        UUID payerUserId = rentCycle.getLease().getUserId();
        UUID confirmedBy = UUID.fromString(userDetails.getId());

        PaymentTransactionTbl transaction = paymentTransactionService.recordCashPayment(
                payerUserId,
                "RENT_CYCLE",
                rentCycleId,
                amount,
                confirmedBy,
                note
        );

        return ResponseEntity.ok(ApiResponse.success(toResponse(transaction)));
    }

    @PostMapping("/webhooks/{gatewayName}")
    public ResponseEntity<Void> handleWebhook(
            @PathVariable String gatewayName,
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader
    ) {
        log.info("Received webhook for gateway: {}", gatewayName);
        paymentTransactionService.handleWebhook(gatewayName, payload, signatureHeader);
        return ResponseEntity.ok().build();
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
