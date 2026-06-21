package com.tenantliving.onboarding.dto;

import com.tenantliving.onboarding.domain.OnboardingMode;
import jakarta.validation.constraints.NotNull;

public record SavePreferenceRequest(
        @NotNull(message = "Active mode is required") OnboardingMode activeMode
) {
}
