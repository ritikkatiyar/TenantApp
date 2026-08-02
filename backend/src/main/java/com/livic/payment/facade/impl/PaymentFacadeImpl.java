package com.livic.payment.facade.impl;

import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.dto.PaymentInitiationRequest;
import com.livic.payment.dto.PaymentInitiationResponse;
import com.livic.payment.facade.PaymentFacade;
import com.livic.payment.service.interfaces.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentFacadeImpl implements PaymentFacade {

    private final PaymentTransactionService paymentTransactionService;

    @Override
    public PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request) {
        log.info("[PAYMENT FACADE] Initiating online payment: {}", request);
        PaymentTransactionTbl transaction = paymentTransactionService.initiateOnlinePayment(
                request.getPayerUserId(),
                request.getReferenceType(),
                request.getReferenceId(),
                request.getAmount()
        );

        return toResponse(transaction);
    }

    @Override
    public PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request) {
        log.info("[PAYMENT FACADE] Recording cash payment: {}", request);
        PaymentTransactionTbl transaction = paymentTransactionService.recordCashPayment(
                request.getPayerUserId(),
                request.getReferenceType(),
                request.getReferenceId(),
                request.getAmount(),
                request.getConfirmedBy(),
                request.getNote()
        );

        return toResponse(transaction);
    }

    @Override
    public Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId) {
        return paymentTransactionService.findTransactionById(transactionId)
                .map(this::toResponse);
    }

    @Override
    public PaymentTransactionTbl initiateOnlinePaymentEntity(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount) {
        return paymentTransactionService.initiateOnlinePayment(payerUserId, referenceType, referenceId, amount);
    }

    @Override
    public PaymentTransactionTbl recordCashPaymentEntity(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note) {
        return paymentTransactionService.recordCashPayment(payerUserId, referenceType, referenceId, amount, confirmedBy, note);
    }

    private PaymentInitiationResponse toResponse(PaymentTransactionTbl tx) {
        return PaymentInitiationResponse.builder()
                .transactionId(tx.getId())
                .gatewayName(tx.getGatewayName())
                .gatewayTransactionId(tx.getGatewayTransactionId())
                .amount(tx.getAmount())
                .currency("INR")
                .status(tx.getStatus())
                .paymentMethod(tx.getPaymentMethod())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
