package com.livic.property.domain;

import com.livic.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "property_join_code_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(callSuper = true)
public class PropertyJoinCodeTbl extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @ToString.Exclude
    private PropertyTbl property;

    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "max_uses", nullable = false)
    @Builder.Default
    private int maxUses = 1;

    @Column(name = "uses_count", nullable = false)
    @Builder.Default
    private int usesCount = 0;

    @Column(name = "expires_at")
    private Instant expiresAt;
}
