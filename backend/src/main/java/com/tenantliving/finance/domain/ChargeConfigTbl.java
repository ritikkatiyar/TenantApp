package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.BillingFrequency;
import com.tenantliving.common.domain.CalculationStrategyType;
import com.tenantliving.common.domain.ChargeCategory;
import com.tenantliving.property.domain.PropertyTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "charge_config_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargeConfigTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(name = "charge_name", nullable = false, length = 100)
    private String chargeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_category", nullable = false, length = 50)
    private ChargeCategory chargeCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_frequency", nullable = false, length = 50)
    private BillingFrequency billingFrequency;

    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_strategy", nullable = false, length = 50)
    private CalculationStrategyType calculationStrategy;

    @Column(name = "base_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal baseRate;

    @Column(name = "apply_sales_tax", nullable = false)
    private Boolean applySalesTax;

    @Column(name = "late_fee_percentage", precision = 5, scale = 2)
    private BigDecimal lateFeePercentage;

    @Column(name = "is_system_required", nullable = false)
    @Builder.Default
    private Boolean isSystemRequired = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
