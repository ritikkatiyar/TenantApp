package com.tenantliving.billing.domain;

import com.tenantliving.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "payment_transaction_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "subscription_id")
    private UUID subscriptionId;

    @Column(name = "gateway_name", nullable = false, length = 20)
    private String gatewayName; // STRIPE, RAZORPAY, PAYPAL

    @Column(name = "gateway_transaction_id", unique = true)
    private String gatewayTransactionId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 20)
    private String status; // PENDING, SUCCESS, FAILED

    @Column(name = "webhook_payload", columnDefinition = "json")
    private String webhookPayload;
}
