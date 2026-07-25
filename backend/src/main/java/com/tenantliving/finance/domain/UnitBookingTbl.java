package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "unit_booking_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitBookingTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @ToString.Exclude
    private UnitTbl unit;

    @Column(name = "prospective_tenant_user_id")
    private UUID prospectiveTenantUserId;

    @Column(name = "prospective_tenant_name", nullable = false)
    private String prospectiveTenantName;

    @Column(name = "prospective_tenant_phone", nullable = false, length = 32)
    private String prospectiveTenantPhone;

    @Column(name = "prospective_tenant_email")
    private String prospectiveTenantEmail;

    @Column(name = "token_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal tokenAmount;

    @Column(name = "expected_move_in_date", nullable = false)
    private LocalDate expectedMoveInDate;

    @Column(nullable = false, length = 32)
    private String status; // BOOKED, CONVERTED, FORFEITED, REFUNDED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    @ToString.Exclude
    private PaymentTransactionTbl paymentTransaction;

    @Column(name = "converted_lease_id")
    private UUID convertedLeaseId;
}
