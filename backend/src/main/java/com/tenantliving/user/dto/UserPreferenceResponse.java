package com.tenantliving.user.dto;

import com.tenantliving.user.domain.UserMode;

import java.util.UUID;

public record UserPreferenceResponse(
        UUID id,
        UserMode activeMode,
        boolean onboardingDone
) {
}
