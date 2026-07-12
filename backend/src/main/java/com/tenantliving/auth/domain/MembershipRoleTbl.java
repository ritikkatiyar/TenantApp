package com.tenantliving.auth.domain;

import com.tenantliving.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "membership_role_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class MembershipRoleTbl extends BaseEntity {

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "property_id", nullable = true)
    @ToString.Exclude
    private com.tenantliving.property.domain.PropertyTbl property;

    @Column(name = "role_rank", nullable = false)
    @Builder.Default
    private int roleRank = 30;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}


