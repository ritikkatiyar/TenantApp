package com.tenantliving.user.domain;

import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.domain.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTbl extends BaseEntity {
    @Column(name = "auth_uid", unique = true, nullable = false)
    private String authUid;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "password_hash")
    private String passwordHash;
}
