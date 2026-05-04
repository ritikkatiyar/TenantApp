package com.tenantliving.unit.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.FacingDirection;
import com.tenantliving.common.domain.UnitType;
import com.tenantliving.property.domain.PropertyTbl;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "unit_tbl", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"property_id", "unit_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnitTbl extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(name = "unit_number", nullable = false)
    private String unitNumber;

    @Column(nullable = false)
    private Integer floor;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "grid_x", nullable = false)
    private Integer gridX;

    @Column(name = "grid_y", nullable = false)
    private Integer gridY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UnitType type;

    @Enumerated(EnumType.STRING)
    private FacingDirection facing;
}
