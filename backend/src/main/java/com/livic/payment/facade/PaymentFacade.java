package com.livic.payment.facade;

import com.livic.payment.dto.PaymentInitiationRequest;
import com.livic.payment.dto.PaymentInitiationResponse;
import com.livic.payment.dto.PaymentTransactionResponse;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface PaymentFacade {

    PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request);

    PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request);

    Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId);

    PaymentTransactionResponse initiateOnlinePaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount);

    PaymentTransactionResponse recordCashPaymentTransaction(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note);
}
