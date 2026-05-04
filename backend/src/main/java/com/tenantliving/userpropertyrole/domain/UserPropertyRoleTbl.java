package com.tenantliving.userpropertyrole.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.PropertyRole;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.user.domain.UserTbl;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_property_role_tbl")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(callSuper = true)
public class UserPropertyRoleTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private UserTbl user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = true)
    @ToString.Exclude
    private UserTbl assignedBy;
}
