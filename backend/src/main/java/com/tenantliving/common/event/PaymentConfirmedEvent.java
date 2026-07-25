package com.tenantliving.common.event;

import org.springframework.context.ApplicationEvent;
import java.math.BigDecimal;
import java.util.UUID;

public class PaymentConfirmedEvent extends ApplicationEvent {
    private final String referenceType;
    private final UUID referenceId;
    private final UUID paymentTransactionId;
    private final BigDecimal amount;
    private final String paymentMethod;

    public PaymentConfirmedEvent(Object source, String referenceType, UUID referenceId, UUID paymentTransactionId, BigDecimal amount, String paymentMethod) {
        super(source);
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.paymentTransactionId = paymentTransactionId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public String getReferenceType() {
        return referenceType;
    }

    public UUID getReferenceId() {
        return referenceId;
    }

    public UUID getPaymentTransactionId() {
        return paymentTransactionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }
}
