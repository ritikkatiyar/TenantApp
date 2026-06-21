package com.tenantliving.onboarding.domain;

import com.tenantliving.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "onboarding_preference_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingPreferenceTbl extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "active_mode", nullable = false)
    private OnboardingMode activeMode;

    @Column(name = "onboarding_done", nullable = false)
    private boolean onboardingDone;
}
