package com.livic.payment.facade;

import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.dto.PaymentInitiationRequest;
import com.livic.payment.dto.PaymentInitiationResponse;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface PaymentFacade {

    PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request);

    PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request);

    Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId);

    PaymentTransactionTbl initiateOnlinePaymentEntity(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount);

    PaymentTransactionTbl recordCashPaymentEntity(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note);
}
