package com.livic.payment.event;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Builder
@ToString
public class PaymentCompletedEvent {
    private final UUID transactionId;
    private final String referenceType; // e.g. "SAAS_SUBSCRIPTION", "RENT_CYCLE"
    private final UUID referenceId;
    private final UUID payerUserId;
    private final BigDecimal amount;
    private final String gatewayName;
    private final String gatewayTransactionId;
}
