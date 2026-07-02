package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "billing_worksheet_entry_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingWorksheetEntryTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @ToString.Exclude
    private UnitTbl unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charge_config_id", nullable = false)
    @ToString.Exclude
    private ChargeConfigTbl chargeConfig;

    @Column(name = "billing_month", length = 7, nullable = false)
    private String billingMonth;

    @Column(name = "entered_value", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal enteredValue = BigDecimal.ZERO;

    @Column(name = "is_billed", nullable = false)
    @Builder.Default
    private Boolean isBilled = false;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;
}
