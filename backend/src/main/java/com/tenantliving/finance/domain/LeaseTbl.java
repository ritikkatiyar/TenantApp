package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.LeaseSplitStrategy;
import com.tenantliving.property.domain.UnitTbl;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "lease_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaseTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @ToString.Exclude
    private UnitTbl unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaseStatus status;

    @Column(name = "move_in_date", nullable = false)
    private LocalDate moveInDate;

    @Column(name = "move_out_date")
    private LocalDate moveOutDate;

    @Column(name = "security_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Enumerated(EnumType.STRING)
    @Column(name = "split_strategy", nullable = false, length = 50)
    private LeaseSplitStrategy splitStrategy;
}
