package com.tenantliving.property.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.user.domain.UserTbl;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "property_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyTbl extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    private String landmark;

    private Integer totalFloors;

    @Column(name = "auto_bill_day_of_month")
    private Integer autoBillDayOfMonth;

    @Column(name = "auto_bill_time")
    private java.time.LocalTime autoBillTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "property_type", nullable = false)
    @Builder.Default
    private PropertyType propertyType = PropertyType.RENTAL;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
