package com.tenantliving.expense.domain;

import com.tenantliving.common.domain.ExpenseType;
import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.expensegroup.domain.ExpenseGroupTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "expense_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_group_id", nullable = false)
    @ToString.Exclude
    private ExpenseGroupTbl expenseGroup;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "expense_type", nullable = false, length = 50)
    private ExpenseType expenseType;

    @Column
    private String description;

    @Column(name = "billing_month", length = 7)
    private String billingMonth;

}
