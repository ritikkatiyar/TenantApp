package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.finance.domain.ExpenseTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "expense_split_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSplitTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    @ToString.Exclude
    private ExpenseTbl expense;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_type", nullable = false, length = 50)
    private ExpenseSplitType splitType;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ExpenseSplitStatus status;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

}
