package com.tenantliving.rentcycle.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.lease.domain.LeaseTbl;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rent_cycle_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class RentCycleTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lease_id", nullable = false)
    @ToString.Exclude
    private LeaseTbl lease;

    @Column(length = 7, nullable = false)
    private String month;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentCycleStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
