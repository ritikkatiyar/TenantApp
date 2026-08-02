package com.livic.payment.service.interfaces;

import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.dto.PaymentVerificationRequest;
import java.math.BigDecimal;
import java.util.UUID;

public interface PaymentTransactionService {

    PaymentTransactionTbl initiateOnlinePayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount);

    PaymentTransactionTbl recordCashPayment(UUID payerUserId, String referenceType, UUID referenceId, BigDecimal amount, UUID confirmedBy, String note);

    void handleWebhook(String gatewayName, String payload, String signatureHeader);

    java.util.Optional<PaymentTransactionTbl> findTransactionById(UUID id);

    com.livic.payment.dto.PaymentTransactionResponse getTransactionResponse(UUID id);

    void verifyAndCompletePayment(PaymentVerificationRequest request);
}
