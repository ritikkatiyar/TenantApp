package com.livic.auth.domain;

import com.livic.common.domain.BaseEntity;
import com.livic.property.domain.PropertyTbl;
import com.livic.user.domain.UserTbl;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "membership_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class MembershipTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private UserTbl user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = true) // Nullable for system-wide memberships or future entities
    @ToString.Exclude
    private PropertyTbl property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    @ToString.Exclude
    private MembershipRoleTbl role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = true)
    @ToString.Exclude
    private UserTbl assignedBy;
}
