package com.tenantliving.onboarding.dto;

import com.tenantliving.onboarding.domain.OnboardingMode;

import java.util.UUID;

public record PreferenceResponse(
        UUID id,
        OnboardingMode activeMode,
        boolean onboardingDone
) {
}
