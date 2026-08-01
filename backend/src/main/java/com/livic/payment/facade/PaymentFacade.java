package com.livic.payment.facade;

import com.livic.payment.dto.PaymentInitiationRequest;
import com.livic.payment.dto.PaymentInitiationResponse;

import java.util.Optional;
import java.util.UUID;

public interface PaymentFacade {

    PaymentInitiationResponse initiateOnlinePayment(PaymentInitiationRequest request);

    PaymentInitiationResponse recordCashPayment(PaymentInitiationRequest request);

    Optional<PaymentInitiationResponse> getTransactionStatus(UUID transactionId);
}
