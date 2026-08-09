package com.livic.auth.domain;

import com.livic.common.domain.BaseEntity;
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

    @Column(name = "property_id")
    private java.util.UUID propertyId;

    @Column(name = "role_rank", nullable = false)
    @Builder.Default
    private int roleRank = 30;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}


