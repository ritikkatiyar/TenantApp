package com.tenantliving.property.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.property.domain.UnitTbl;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = true)
    @ToString.Exclude
    private UserTbl owner;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private List<UnitTbl> units = new ArrayList<>();
}
