package com.tenantliving.finance.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "meter_reading_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterReadingTbl extends BaseEntity {

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

    @Column(name = "billing_month", nullable = false)
    private Integer billingMonth;

    @Column(name = "billing_year", nullable = false)
    private Integer billingYear;

    @Column(name = "previous_reading", nullable = false, precision = 10, scale = 2)
    private BigDecimal previousReading;

    @Column(name = "current_reading", precision = 10, scale = 2)
    private BigDecimal currentReading;

    @Column(name = "is_billed", nullable = false)
    private Boolean isBilled;
}
